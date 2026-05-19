import { Body, Controller, Get, Param, Post, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { ClerkAuthGuard } from '../../common/guard/clerk-auth.guard';
import { Permission } from '../../common/decorator/permission.decorator';
import {
  AssignUserRoleRequest,
  PermissionAction,
  RemoveUserRoleRequest,
  PermissionResource,
  PermissionScope,
  UpsertRolePermissionsRequest,
} from '@movie-hub/shared-types';

@Controller({ version: '1', path: 'users' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(ClerkAuthGuard)
  @Permission({
    resource: PermissionResource.USER,
    action: PermissionAction.READ,
    scope: PermissionScope.GLOBAL,
  })
  getUser() {
    return this.userService.getUsers();
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  @Permission({
    resource: PermissionResource.USER,
    action: PermissionAction.READ,
    scope: PermissionScope.GLOBAL,
  })
  getMe(@Req() req: any) {
    return {
      userId: req.userId,
      ...req.staffContext,
    };
  }

  @Get('me/permissions')
  @UseGuards(ClerkAuthGuard)
  getMePermissions(@Req() req: any) {
    return this.userService.getUserEffectivePermissions(req.userId);
  }

  @Get('rbac/roles')
  @UseGuards(ClerkAuthGuard)
  @Permission({
    resource: PermissionResource.RBAC,
    action: PermissionAction.READ,
    scope: PermissionScope.GLOBAL,
  })
  listRoles() {
    return this.userService.listRoles();
  }

  @Get('rbac/permissions')
  @UseGuards(ClerkAuthGuard)
  @Permission({
    resource: PermissionResource.RBAC,
    action: PermissionAction.READ,
    scope: PermissionScope.GLOBAL,
  })
  listPermissions() {
    return this.userService.listPermissions();
  }

  @Put('rbac/roles/:role/permissions')
  @UseGuards(ClerkAuthGuard)
  @Permission({
    resource: PermissionResource.RBAC,
    action: PermissionAction.UPDATE,
    scope: PermissionScope.GLOBAL,
  })
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
  @Permission({
    resource: PermissionResource.RBAC,
    action: PermissionAction.UPDATE,
    scope: PermissionScope.GLOBAL,
  })
  assignUserRole(@Param('userId') userId: string, @Param('role') role: string) {
    const payload: AssignUserRoleRequest = { userId, role };
    return this.userService.assignUserRole(payload);
  }

  @Delete('rbac/users/:userId/roles/:role')
  @UseGuards(ClerkAuthGuard)
  @Permission({
    resource: PermissionResource.RBAC,
    action: PermissionAction.UPDATE,
    scope: PermissionScope.GLOBAL,
  })
  removeUserRole(@Param('userId') userId: string, @Param('role') role: string) {
    const payload: RemoveUserRoleRequest = { userId, role };
    return this.userService.removeUserRole(payload);
  }

  @Get('rbac/users/:userId/permissions')
  @UseGuards(ClerkAuthGuard)
  @Permission({
    resource: PermissionResource.RBAC,
    action: PermissionAction.READ,
    scope: PermissionScope.GLOBAL,
  })
  getUserEffectivePermissions(@Param('userId') userId: string) {
    return this.userService.getUserEffectivePermissions(userId);
  }


}

