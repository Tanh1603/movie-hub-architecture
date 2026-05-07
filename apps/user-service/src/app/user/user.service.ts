import { clerkClient } from '@clerk/clerk-sdk-node';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma.service';
import { Prisma } from '../../../generated/prisma';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
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
        select: { name: true },
      })
      .then((r) => r.map((p) => p.name));

    await this.cacheManager.set(cacheKey, permissions);
    return permissions;
  }

  async getUser() {
    return clerkClient.users.getUserList();
  }

  async getUserDetail(userId: string) {
    const user = await clerkClient.users.getUser(userId);
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
}
