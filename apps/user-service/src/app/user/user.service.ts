import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma.service';
import { Prisma, StaffStatus } from '../../../generated/prisma';
import { CLERK_CLIENT } from '../clerk.module';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(CLERK_CLIENT) private readonly clerkClient: any
  ) {}

  async getPermissions(userId: string): Promise<string[]> {
    const cacheKey = `permissions:${userId}`;
    const cached = await this.cacheManager.get<string[]>(cacheKey);
    if (cached) return cached;

    const permissions = await this.prismaService.permission
      .findMany({
        where: {
          rolePermissions: {
            some: {
              role: {
                userRoles: {
                  some: { userId },
                },
              },
            },
          },
        },
        select: {
          resource: { select: { code: true } },
          action: true,
          scope: true,
        },
      })
      .then((rows) =>
        rows.map(
          (p) =>
            `${p.resource.code}:${String(p.action).toLowerCase()}:${String(
              p.scope
            ).toLowerCase()}`
        )
      );

    await this.cacheManager.set(cacheKey, permissions);
    return permissions;
  }

  async invalidatePermissionsCache(userId: string): Promise<void> {
    await this.cacheManager.del(`permissions:${userId}`);
  }

  async getUser() {
    return this.clerkClient.users.getUserList();
  }

  async getUserDetail(userId: string) {
    const user = await this.clerkClient.users.getUser(userId);
    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName:
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        user.username ||
        'Guest',
      phone: user.phoneNumbers[0]?.phoneNumber || '',
      imageUrl: user.imageUrl,
    };
  }

  async findSettingVariables() {
    try {
      const settings = await this.prismaService.setting.findMany();

      if (!settings || settings.length === 0) {
        // Return default theme if no configuration exists
        return {
          data: [
            {
              key: 'theme',
              value: {
                theme: 'system',
                radius: 0.5,
              },
              description: 'Default Theme Configuration',
            },
          ],
        };
      }

      return {
        data: settings,
      };
    } catch (error) {
      console.error('Error finding setting variables:', error);
      throw error;
    }
  }

  async updateSettingVariable(dto: {
    key: string;
    value: Prisma.JsonObject;
    description?: string;
  }) {
    return {
      data: await this.prismaService.setting.upsert({
        where: { key: dto.key },
        update: {
          value: dto.value ?? undefined,
          description: dto.description ? dto.description : undefined,
        },
        create: {
          key: dto.key,
          value: dto.value ?? {},
          description: dto.description || '',
        },
      }),
      message: 'Update setting variable successfully!',
    };
  }

  async processClerkWebhook(input: {
    eventId?: string;
    eventType?: string;
    data?: { id?: string };
    raw?: unknown;
    correlationId?: string;
  }) {
    if (!input.eventId || !input.eventType) {
      throw new Error('Invalid Clerk webhook envelope');
    }

    const existing = await this.prismaService.clerkWebhookEvent.findUnique({
      where: { eventId: input.eventId },
      select: { id: true },
    });
    if (existing) {
      return { ok: true, deduped: true };
    }

    const clerkUserId = input.data?.id;
    if (!clerkUserId) {
      await this.prismaService.clerkWebhookEvent.create({
        data: {
          eventId: input.eventId,
          eventType: input.eventType,
          payload: (input.raw ?? {}) as Prisma.JsonObject,
        },
      });
      return { ok: true };
    }

    if (input.eventType === 'user.created') {
      await this.assignCustomerRoleIfMissing(clerkUserId, input.correlationId);
    } else if (input.eventType === 'user.deleted') {
      await this.prismaService.staff.updateMany({
        where: { clerkUserId },
        data: { status: StaffStatus.INACTIVE },
      });
    }

    await this.prismaService.clerkWebhookEvent.create({
      data: {
        eventId: input.eventId,
        eventType: input.eventType,
        payload: (input.raw ?? {}) as Prisma.JsonObject,
      },
    });

    return { ok: true };
  }

  async bootstrapDefaultSuperAdmin(correlationId?: string) {
    const email = process.env.DEFAULT_ADMIN_EMAIL;
    if (!email) {
      throw new Error('DEFAULT_ADMIN_EMAIL is required');
    }

    const userList = await this.clerkClient.users.getUserList({
      emailAddress: [email],
    });
    const password = process.env.DEFAULT_ADMIN_INITIAL_PASSWORD;
    let clerkUserId: string;
    if (userList.data.length === 0) {
      if (!password) {
        this.logger.error(
          `Missing admin account and DEFAULT_ADMIN_INITIAL_PASSWORD not set correlationId=${correlationId ?? 'n/a'}`
        );
        throw new Error('Default admin Clerk account not found');
      }
      const created = await this.clerkClient.users.createUser({
        emailAddress: [email],
        password,
        skipPasswordChecks: true,
      });
      clerkUserId = created.id;
    } else {
      clerkUserId = userList.data[0].id;
    }
    await this.assignRole(clerkUserId, 'SUPER_ADMIN');
    this.logger.log(
      `Ensured SUPER_ADMIN mapping for clerkUserId=${clerkUserId} correlationId=${correlationId ?? 'n/a'}`
    );
    return { ok: true, userId: clerkUserId };
  }

  private async assignCustomerRoleIfMissing(
    userId: string,
    correlationId?: string
  ): Promise<void> {
    const hasAnyRole = await this.prismaService.userRole.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (hasAnyRole) {
      return;
    }

    await this.assignRole(userId, 'CUSTOMER');
    this.logger.log(
      `Auto-assigned CUSTOMER role userId=${userId} correlationId=${correlationId ?? 'n/a'}`
    );
  }

  async assignRole(userId: string, roleName: string): Promise<void> {
    const role = await this.prismaService.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
      select: { id: true },
    });

    const exists = await this.prismaService.userRole.findFirst({
      where: { userId, roleId: role.id },
      select: { id: true },
    });

    if (!exists) {
      await this.prismaService.userRole.create({
        data: { userId, roleId: role.id },
      });
    }

    await this.invalidatePermissionsCache(userId);
  }
}
