import { UserMessage } from '@movie-hub/shared-types';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { Prisma } from '../../../generated/prisma';
import { RbacService } from './rbac.service';
import {
  AssignUserRoleRequest,
  RemoveUserRoleRequest,
  UpsertRolePermissionsRequest,
} from '@movie-hub/shared-types';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly rbacService: RbacService
  ) {}

  @MessagePattern(UserMessage.GET_PERMISSIONS)
  async getPermissions(data: { userId: string }) {
    return this.userService.getPermissions(data.userId);
  }

  @MessagePattern(UserMessage.GET_USER_ROLES)
  async getUserRoles(data: { userId: string }) {
    return this.userService.getUserRoles(data.userId);
  }

  @MessagePattern(UserMessage.GET_USERS)
  getUser() {
    return this.userService.getUser();
  }

  @MessagePattern(UserMessage.GET_USER_DETAIL)
  async getUserDetail(userId: string) {
    return this.userService.getUserDetail(userId);
  }

  @MessagePattern(UserMessage.CONFIG.GET_LIST)
  async findSettingVariables() {
    return this.userService.findSettingVariables();
  }

  @MessagePattern(UserMessage.CONFIG.UPDATED)
  async updateSettingVariable(
    @Payload()
    data: {
      key: string;
      value: Prisma.JsonObject;
      description?: string;
    }
  ) {
    return this.userService.updateSettingVariable(data);
  }

  @MessagePattern(UserMessage.RBAC.LIST_ROLES)
  async listRoles() {
    return this.rbacService.listRoles();
  }

  @MessagePattern(UserMessage.RBAC.LIST_PERMISSIONS)
  async listPermissions() {
    return this.rbacService.listPermissions();
  }

  @MessagePattern(UserMessage.RBAC.UPSERT_ROLE_PERMISSIONS)
  async upsertRolePermissions(@Payload() data: UpsertRolePermissionsRequest) {
    return this.rbacService.upsertRolePermissions(data);
  }

  @MessagePattern(UserMessage.RBAC.ASSIGN_USER_ROLE)
  async assignUserRole(@Payload() data: AssignUserRoleRequest) {
    return this.rbacService.assignUserRole(data);
  }

  @MessagePattern(UserMessage.RBAC.REMOVE_USER_ROLE)
  async removeUserRole(@Payload() data: RemoveUserRoleRequest) {
    return this.rbacService.removeUserRole(data);
  }

  @MessagePattern(UserMessage.AUTH.PROCESS_CLERK_WEBHOOK)
  async processClerkWebhook(@Payload() data: unknown) {
    return this.userService.processClerkWebhook(data as any);
  }
}
