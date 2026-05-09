import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { clerkClient } from '@clerk/clerk-sdk-node';
import {
  ClerkSyncAction,
  ClerkSyncStatus,
  Prisma,
  StaffPosition,
} from '../../../generated/prisma';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

type UpsertPayload = {
  email: string;
  fullName: string;
  position: string;
  cinemaId: string;
  status: string;
};

type DeletePayload = {
  email: string;
};

@Injectable()
export class ClerkSyncService {
  private readonly logger = new Logger(ClerkSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  async enqueueUpsert(payload: UpsertPayload, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    await client.clerkSyncTask.create({
      data: {
        action: ClerkSyncAction.UPSERT,
        payload,
      },
    });
  }

  async enqueueDelete(payload: DeletePayload, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    await client.clerkSyncTask.create({
      data: {
        action: ClerkSyncAction.DELETE,
        payload,
      },
    });
  }

  @Cron('*/30 * * * * *')
  async processDueTasks() {
    const now = new Date();
    const tasks = await this.prisma.clerkSyncTask.findMany({
      where: {
        status: { in: [ClerkSyncStatus.PENDING, ClerkSyncStatus.FAILED] },
        nextRetryAt: { lte: now },
      },
      orderBy: [{ nextRetryAt: 'asc' }, { createdAt: 'asc' }],
      take: 20,
    });

    for (const task of tasks) {
      const lock = await this.prisma.clerkSyncTask.updateMany({
        where: {
          id: task.id,
          status: { in: [ClerkSyncStatus.PENDING, ClerkSyncStatus.FAILED] },
          nextRetryAt: { lte: now },
        },
        data: {
          status: ClerkSyncStatus.PROCESSING,
          lockedAt: new Date(),
        },
      });

      if (lock.count === 0) {
        continue;
      }

      try {
        await this.executeTask(task.action, task.payload);
        await this.prisma.clerkSyncTask.update({
          where: { id: task.id },
          data: {
            status: ClerkSyncStatus.SUCCEEDED,
            completedAt: new Date(),
            lockedAt: null,
            lastError: null,
          },
        });
      } catch (error) {
        const attempts = task.attempts + 1;
        const maxedOut = attempts >= task.maxAttempts;

        await this.prisma.clerkSyncTask.update({
          where: { id: task.id },
          data: {
            attempts,
            status: ClerkSyncStatus.FAILED,
            lockedAt: null,
            lastError: this.toErrorMessage(error),
            nextRetryAt: this.calculateNextRetry(attempts, maxedOut),
          },
        });

        this.logger.warn(
          `Clerk sync task failed id=${task.id} attempt=${attempts}/${task.maxAttempts}`
        );
      }
    }
  }

  private async executeTask(action: ClerkSyncAction, payload: Prisma.JsonValue) {
    if (action === ClerkSyncAction.UPSERT) {
      await this.syncUpsert(payload as unknown as UpsertPayload);
      return;
    }

    if (action === ClerkSyncAction.DELETE) {
      await this.syncDelete(payload as unknown as DeletePayload);
    }
  }

  private async syncUpsert(payload: UpsertPayload) {
    const userList = await clerkClient.users.getUserList({
      emailAddress: [payload.email],
    });

    const metadata = {
      role: payload.position,
      cinemaId: payload.cinemaId,
      staffStatus: payload.status,
    };

    let userId: string;
    if (userList.data.length === 0) {
      const [firstName, ...lastNameParts] = payload.fullName.split(' ');
      const created = await clerkClient.users.createUser({
        emailAddress: [payload.email],
        firstName,
        lastName: lastNameParts.join(' '),
        skipPasswordChecks: true,
        publicMetadata: metadata,
      });
      userId = created.id;
    } else {
      const currentUser = userList.data[0];
      await clerkClient.users.updateUser(currentUser.id, {
        publicMetadata: metadata,
      });
      userId = currentUser.id;
    }

    await this.syncPositionRole(userId, payload.position);
  }

  private async syncDelete(payload: DeletePayload) {
    const userList = await clerkClient.users.getUserList({
      emailAddress: [payload.email],
    });

    if (userList.data.length === 0) {
      return;
    }

    await clerkClient.users.deleteUser(userList.data[0].id);
  }

  private calculateNextRetry(attempts: number, maxedOut: boolean): Date {
    // Keep failed tasks for reconciliation visibility even after max attempts.
    if (maxedOut) {
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const backoffSeconds = Math.min(30 * Math.pow(2, attempts - 1), 3600);
    return new Date(Date.now() + backoffSeconds * 1000);
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message.slice(0, 2000);
    }

    return 'Unknown Clerk sync error';
  }

  private async syncPositionRole(userId: string, positionRaw: string): Promise<void> {
    const position = positionRaw as StaffPosition;
    const roleName = position;

    await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName },
      });

      const positionRoleNames = Object.values(StaffPosition);
      const stale = await tx.userRole.findMany({
        where: {
          userId,
          role: {
            name: { in: positionRoleNames.filter((name) => name !== roleName) },
          },
        },
        select: { id: true },
      });

      if (stale.length > 0) {
        await tx.userRole.deleteMany({
          where: { id: { in: stale.map((item) => item.id) } },
        });
      }

      const assigned = await tx.userRole.findFirst({
        where: { userId, roleId: role.id },
        select: { id: true },
      });

      if (!assigned) {
        await tx.userRole.create({
          data: {
            userId,
            roleId: role.id,
          },
        });
      }
    });

    await this.cacheManager.del(`permissions:${userId}`);
  }
}
