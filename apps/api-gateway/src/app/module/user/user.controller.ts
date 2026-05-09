import { Body, Controller, Get, Param, Post, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { ClerkAuthGuard } from '../../common/guard/clerk-auth.guard';
import { Permission } from '../../common/decorator/permission.decorator';
import {
  AssignUserRoleRequest,
  RemoveUserRoleRequest,
  UpsertRolePermissionsRequest,
} from '@movie-hub/shared-types';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(ClerkAuthGuard)
  @Permission({ resource: 'user', action: 'read', scope: 'global' })
  getUser() {
    return this.userService.getUsers();
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  @Permission({ resource: 'user', action: 'read', scope: 'global' })
  getMe(@Req() req: any) {
    return {
      userId: req.userId,
      ...req.staffContext,
    };
  }

  @Get('rbac/roles')
  @UseGuards(ClerkAuthGuard)
  @Permission({ resource: 'rbac', action: 'read', scope: 'global' })
  listRoles() {
    return this.userService.listRoles();
  }

  @Get('rbac/permissions')
  @UseGuards(ClerkAuthGuard)
  @Permission({ resource: 'rbac', action: 'read', scope: 'global' })
  listPermissions() {
    return this.userService.listPermissions();
  }

  @Put('rbac/roles/:role/permissions')
  @UseGuards(ClerkAuthGuard)
  @Permission({ resource: 'rbac', action: 'update', scope: 'global' })
  upsertRolePermissions(
    @Param('role') role: string,
    @Body() body: { permissions: string[] }
  ) {
    const payload: UpsertRolePermissionsRequest = {
      role,
      permissions: body.permissions || [],
    };
    return this.userService.upsertRolePermissions(payload);
  }

  @Post('rbac/users/:userId/roles/:role')
  @UseGuards(ClerkAuthGuard)
  @Permission({ resource: 'rbac', action: 'update', scope: 'global' })
  assignUserRole(@Param('userId') userId: string, @Param('role') role: string) {
    const payload: AssignUserRoleRequest = { userId, role };
    return this.userService.assignUserRole(payload);
  }

  @Delete('rbac/users/:userId/roles/:role')
  @UseGuards(ClerkAuthGuard)
  @Permission({ resource: 'rbac', action: 'update', scope: 'global' })
  removeUserRole(@Param('userId') userId: string, @Param('role') role: string) {
    const payload: RemoveUserRoleRequest = { userId, role };
    return this.userService.removeUserRole(payload);
  }

  @Get('rbac/users/:userId/permissions')
  @UseGuards(ClerkAuthGuard)
  @Permission({ resource: 'rbac', action: 'read', scope: 'global' })
  getUserEffectivePermissions(@Param('userId') userId: string) {
    return this.userService.getUserEffectivePermissions(userId);
  }

  @Post('rbac/bootstrap-super-admin')
  @UseGuards(ClerkAuthGuard)
  @Permission({ resource: 'rbac', action: 'update', scope: 'global' })
  bootstrapSuperAdmin(@Req() req: any) {
    return this.userService.bootstrapSuperAdmin(req?.correlationId);
  }
}

