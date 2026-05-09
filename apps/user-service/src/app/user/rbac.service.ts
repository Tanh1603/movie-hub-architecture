import { Injectable } from '@nestjs/common';
import {
  AssignUserRoleRequest,
  PermissionView,
  RemoveUserRoleRequest,
  RolePermissionView,
  UpsertRolePermissionsRequest,
} from '@movie-hub/shared-types';
import { PrismaService } from '../prisma.service';
import { UserService } from './user.service';

@Injectable()
export class RbacService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService
  ) {}

  async listRoles(): Promise<RolePermissionView[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => ({
      role: role.name,
      permissions: role.rolePermissions.map((rp) => rp.permission.name),
    }));
  }

  async listPermissions(): Promise<PermissionView[]> {
    const permissions = await this.prisma.permission.findMany({
      include: {
        resource: true,
      },
      orderBy: [{ resource: { code: 'asc' } }, { action: 'asc' }, { scope: 'asc' }],
    });

    return permissions.map((permission) => ({
      name: permission.name,
      resource: permission.resource.code,
      action: String(permission.action).toLowerCase(),
      scope: String(permission.scope).toLowerCase(),
    }));
  }

  async upsertRolePermissions(input: UpsertRolePermissionsRequest): Promise<RolePermissionView> {
    const permissions = await this.prisma.permission.findMany({
      where: { name: { in: input.permissions } },
      select: { id: true, name: true },
    });
    const found = new Set(permissions.map((p) => p.name));
    const missing = input.permissions.filter((p) => !found.has(p));
    if (missing.length > 0) {
      throw new Error(`Unknown permissions: ${missing.join(', ')}`);
    }

    const role = await this.prisma.$transaction(async (tx) => {
      const savedRole = await tx.role.upsert({
        where: { name: input.role },
        update: {},
        create: { name: input.role },
      });

      await tx.rolePermission.deleteMany({ where: { roleId: savedRole.id } });
      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: savedRole.id,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        });
      }

      return savedRole;
    });

    const refreshed = await this.prisma.role.findUniqueOrThrow({
      where: { id: role.id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    await this.invalidateRoleUsersPermissionCache(role.id);

    return {
      role: refreshed.name,
      permissions: refreshed.rolePermissions.map((rp) => rp.permission.name),
    };
  }

  async assignUserRole(input: AssignUserRoleRequest): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { name: input.role },
      select: { id: true },
    });
    if (!role) {
      throw new Error(`Role not found: ${input.role}`);
    }

    const exists = await this.prisma.userRole.findFirst({
      where: { userId: input.userId, roleId: role.id },
      select: { id: true },
    });

    if (!exists) {
      await this.prisma.userRole.create({
        data: {
          userId: input.userId,
          roleId: role.id,
        },
      });
    }

    await this.userService.invalidatePermissionsCache(input.userId);
  }

  async removeUserRole(input: RemoveUserRoleRequest): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { name: input.role },
      select: { id: true },
    });
    if (!role) {
      return;
    }

    await this.prisma.userRole.deleteMany({
      where: {
        userId: input.userId,
        roleId: role.id,
      },
    });

    await this.userService.invalidatePermissionsCache(input.userId);
  }

  async getEffectivePermissions(userId: string): Promise<string[]> {
    return this.userService.getPermissions(userId);
  }

  private async invalidateRoleUsersPermissionCache(roleId: string): Promise<void> {
    const users = await this.prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true },
      distinct: ['userId'],
    });
    await Promise.all(
      users.map((row) => this.userService.invalidatePermissionsCache(row.userId))
    );
  }
}

