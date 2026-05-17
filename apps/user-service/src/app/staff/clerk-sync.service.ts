import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  ClerkSyncAction,
  ClerkSyncStatus,
  Prisma,
  StaffPosition,
  StaffStatus,
} from '../../../generated/prisma';
import { PrismaService } from '../prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CLERK_CLIENT } from '../clerk.module';
import { createHash } from 'crypto';

type UpsertPayload = {
  email: string;
  fullName: string;
  position: string;
  cinemaId: string;
  status: string;
};

type DeletePayload = {
  email?: string;
  clerkUserId?: string;
};

@Injectable()
export class ClerkSyncService {
  private readonly logger = new Logger(ClerkSyncService.name);
  private readonly retryDelaysSeconds = [1, 2, 4];
  private readonly maxAttempts = Math.min(
    Number(process.env.CLERK_SYNC_MAX_ATTEMPTS ?? this.retryDelaysSeconds.length),
    this.retryDelaysSeconds.length
  );
  private readonly syncMetrics = {
    processed: 0,
    succeeded: 0,
    retried: 0,
    deadLettered: 0,
    reconciledChecked: 0,
    reconciledCorrected: 0,
    reconciledFailed: 0,
  };

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(CLERK_CLIENT) private readonly clerkClient: any
  ) {}

  async enqueueUpsert(payload: UpsertPayload, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    const syncKey = this.buildSyncKey(ClerkSyncAction.UPSERT, payload);

    const existing = await client.clerkSyncTask.findFirst({
      where: {
        syncKey,
        status: {
          in: [
            ClerkSyncStatus.PENDING,
            ClerkSyncStatus.PROCESSING,
            ClerkSyncStatus.FAILED,
          ],
        },
      },
      select: { id: true },
    });

    if (existing) {
      return existing.id;
    }

    const task = await client.clerkSyncTask.create({
      data: {
        action: ClerkSyncAction.UPSERT,
        payload,
        syncKey,
        maxAttempts: this.maxAttempts,
      },
      select: { id: true },
    });

    return task.id;
  }

  async enqueueDelete(payload: DeletePayload, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    const syncKey = this.buildSyncKey(ClerkSyncAction.DELETE, payload);

    const existing = await client.clerkSyncTask.findFirst({
      where: {
        syncKey,
        status: {
          in: [
            ClerkSyncStatus.PENDING,
            ClerkSyncStatus.PROCESSING,
            ClerkSyncStatus.FAILED,
          ],
        },
      },
      select: { id: true },
    });

    if (existing) {
      return existing.id;
    }

    const task = await client.clerkSyncTask.create({
      data: {
        action: ClerkSyncAction.DELETE,
        payload,
        syncKey,
        maxAttempts: this.maxAttempts,
      },
      select: { id: true },
    });

    return task.id;
  }

  async ensureClerkUserForStaff(payload: UpsertPayload): Promise<string> {
    const userList = await this.clerkClient.users.getUserList({
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
      const defaultStaffPassword = process.env.DEFAULT_STAFF_INITIAL_PASSWORD;
      if (!defaultStaffPassword) {
        throw new Error('DEFAULT_STAFF_INITIAL_PASSWORD is required to create staff');
      }
      const created = await this.clerkClient.users.createUser({
        emailAddress: [payload.email],
        firstName,
        lastName: lastNameParts.join(' '),
        password: defaultStaffPassword,
        skipPasswordChecks: true,
        publicMetadata: metadata,
      });
      userId = created.id;
    } else {
      const currentUser = userList.data[0];
      await this.clerkClient.users.updateUser(currentUser.id, {
        publicMetadata: metadata,
      });
      userId = currentUser.id;
    }

    await this.syncPositionRole(userId, payload.position);
    return userId;
  }

  @Cron(process.env.CLERK_SYNC_PROCESS_CRON ?? '*/10 * * * * *')
  async processDueTasks() {
    const now = new Date();
    const tasks = await this.prisma.clerkSyncTask.findMany({
      where: {
        status: { in: [ClerkSyncStatus.PENDING, ClerkSyncStatus.FAILED] },
        nextRetryAt: { lte: now },
        attempts: { lt: this.maxAttempts },
      },
      orderBy: [{ nextRetryAt: 'asc' }, { createdAt: 'asc' }],
      take: 20,
    });

    for (const task of tasks) {
      this.syncMetrics.processed += 1;
      const lock = await this.prisma.clerkSyncTask.updateMany({
        where: {
          id: task.id,
          status: { in: [ClerkSyncStatus.PENDING, ClerkSyncStatus.FAILED] },
          nextRetryAt: { lte: now },
          attempts: { lt: this.maxAttempts },
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
        this.syncMetrics.succeeded += 1;
      } catch (error) {
        const attempts = task.attempts + 1;
        const retryable = this.isRetryableError(error);
        const maxedOut = attempts >= this.maxAttempts || !retryable;

        await this.prisma.clerkSyncTask.update({
          where: { id: task.id },
          data: {
            attempts,
            status: ClerkSyncStatus.FAILED,
            lockedAt: null,
            lastError: this.toErrorMessage(error),
            nextRetryAt: this.calculateNextRetry(attempts, maxedOut),
            deadLetteredAt: maxedOut ? new Date() : null,
          },
        });

        if (maxedOut) {
          this.syncMetrics.deadLettered += 1;
          this.logger.error(
            `Clerk sync task dead-lettered id=${task.id} syncKey=${task.syncKey} attempts=${attempts}`
          );
          continue;
        }

        this.syncMetrics.retried += 1;
        this.logger.warn(
          `Clerk sync task failed id=${task.id} attempt=${attempts}/${this.maxAttempts}`
        );
      }
    }

    if (tasks.length > 0) {
      this.logger.log(
        `clerk_sync_metrics processed=${this.syncMetrics.processed} succeeded=${this.syncMetrics.succeeded} retried=${this.syncMetrics.retried} dead_lettered=${this.syncMetrics.deadLettered}`
      );
    }
  }

  @Cron(process.env.CLERK_SYNC_RECONCILIATION_CRON ?? '0 */5 * * * *')
  async reconcileStaffMetadataDrift() {
    const reconciliationId = `recon_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    const staffs = await this.prisma.staff.findMany({
      where: { clerkUserId: { not: null } },
      select: {
        id: true,
        clerkUserId: true,
        email: true,
        fullName: true,
        position: true,
        cinemaId: true,
        status: true,
      },
      take: 200,
      orderBy: { updatedAt: 'desc' },
    });

    let corrected = 0;

    for (const staff of staffs) {
      this.syncMetrics.reconciledChecked += 1;
      const clerkUserId = staff.clerkUserId;
      if (!clerkUserId) {
        continue;
      }

      try {
        const user = await this.clerkClient.users.getUser(clerkUserId);
        const current = user?.publicMetadata ?? {};

        // Canonical source of truth: internal DB
        // Reconciliation direction: internal → Clerk (never Clerk → internal)
        const expected = {
          role: staff.position,
          cinemaId: staff.cinemaId,
          staffStatus: staff.status,
        };

        const drifted =
          String(current.role ?? '') !== String(expected.role) ||
          String(current.cinemaId ?? '') !== String(expected.cinemaId) ||
          String(current.staffStatus ?? '') !== String(expected.staffStatus);

        if (drifted) {
          // Capture before/after snapshot for audit trail
          const beforeSnapshot = {
            role: String(current.role ?? ''),
            cinemaId: String(current.cinemaId ?? ''),
            staffStatus: String(current.staffStatus ?? ''),
          };
          const afterSnapshot = {
            role: String(expected.role),
            cinemaId: String(expected.cinemaId),
            staffStatus: String(expected.staffStatus),
          };

          await this.clerkClient.users.updateUser(clerkUserId, {
            publicMetadata: {
              ...current,
              ...expected,
            },
          });

          corrected += 1;
          this.syncMetrics.reconciledCorrected += 1;

          // Audit trail: actor, direction, before/after, correlation ID
          this.logger.warn(
            `clerk_sync_drift_repaired ` +
              `actor=system:reconciliation ` +
              `direction=internal_to_clerk ` +
              `staffId=${staff.id} ` +
              `clerkUserId=${clerkUserId} ` +
              `before=${JSON.stringify(beforeSnapshot)} ` +
              `after=${JSON.stringify(afterSnapshot)} ` +
              `correlationId=${reconciliationId}`
          );
        }

        await this.syncPositionRole(clerkUserId, staff.position);
      } catch (error) {
        this.syncMetrics.reconciledFailed += 1;
        this.logger.error(
          `Clerk reconciliation failed ` +
            `staffId=${staff.id} ` +
            `clerkUserId=${clerkUserId} ` +
            `correlationId=${reconciliationId} ` +
            `error=${this.toErrorMessage(error)}`
        );
      }
    }

    this.logger.log(
      `clerk_reconciliation_metrics ` +
        `checked=${this.syncMetrics.reconciledChecked} ` +
        `corrected=${this.syncMetrics.reconciledCorrected} ` +
        `failed=${this.syncMetrics.reconciledFailed} ` +
        `corrected_this_run=${corrected} ` +
        `correlationId=${reconciliationId}`
    );
  }

  private async executeTask(action: ClerkSyncAction, payload: Prisma.JsonValue) {
    if (action === ClerkSyncAction.UPSERT) {
      await this.ensureClerkUserForStaff(payload as unknown as UpsertPayload);
      return;
    }

    if (action === ClerkSyncAction.DELETE) {
      await this.syncDelete(payload as unknown as DeletePayload);
    }
  }

  private async syncDelete(payload: DeletePayload) {
    if (payload.clerkUserId) {
      await this.clerkClient.users.deleteUser(payload.clerkUserId);
      return;
    }

    if (!payload.email) {
      return;
    }

    const userList = await this.clerkClient.users.getUserList({
      emailAddress: [payload.email],
    });

    if (userList.data.length === 0) {
      return;
    }

    await this.clerkClient.users.deleteUser(userList.data[0].id);
  }

  private buildSyncKey(action: ClerkSyncAction, payload: UpsertPayload | DeletePayload) {
    const normalized = JSON.stringify(this.sortObject(payload));
    const digest = createHash('sha256').update(`${action}:${normalized}`).digest('hex');
    return `${action.toLowerCase()}:${digest}`;
  }

  private sortObject(obj: Record<string, unknown>): Record<string, unknown> {
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        const value = obj[key];
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});
  }

  private calculateNextRetry(attempts: number, maxedOut: boolean): Date {
    if (maxedOut) {
      return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    const delay = this.retryDelaysSeconds[Math.max(0, attempts - 1)] ?? 4;
    return new Date(Date.now() + delay * 1000);
  }

  private isRetryableError(error: unknown): boolean {
    const anyError = error as { status?: number; statusCode?: number; code?: string; message?: string };
    const status = anyError?.status ?? anyError?.statusCode;
    if (typeof status === 'number') {
      if (status >= 500 || status === 429 || status === 408) {
        return true;
      }
      if (status >= 400 && status < 500) {
        return false;
      }
    }

    const code = String(anyError?.code ?? '').toUpperCase();
    if (code.includes('TIMEOUT') || code.includes('ECONN') || code.includes('ETIMEDOUT')) {
      return true;
    }

    const message = String(anyError?.message ?? '').toLowerCase();
    if (message.includes('timeout') || message.includes('network') || message.includes('rate limit')) {
      return true;
    }

    return false;
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
