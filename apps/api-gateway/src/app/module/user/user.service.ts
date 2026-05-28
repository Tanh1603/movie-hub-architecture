import { SERVICE_NAME, UserMessage } from '@movie-hub/shared-types';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  AssignUserRoleRequest,
  RemoveUserRoleRequest,
  UpsertRolePermissionsRequest,
} from '@movie-hub/shared-types';
@Injectable()
export class UserService {
  constructor(@Inject(SERVICE_NAME.USER) private readonly userClient: ClientProxy) {}

  async getUsers() {
    return lastValueFrom(this.userClient.send(UserMessage.GET_USERS, {}));
  }

  async listRoles() {
    return lastValueFrom(this.userClient.send(UserMessage.RBAC.LIST_ROLES, {}));
  }

  async listPermissions() {
    return lastValueFrom(
      this.userClient.send(UserMessage.RBAC.LIST_PERMISSIONS, {})
    );
  }

  async upsertRolePermissions(data: UpsertRolePermissionsRequest) {
    return lastValueFrom(
      this.userClient.send(UserMessage.RBAC.UPSERT_ROLE_PERMISSIONS, data)
    );
  }

  async assignUserRole(data: AssignUserRoleRequest) {
    return lastValueFrom(this.userClient.send(UserMessage.RBAC.ASSIGN_USER_ROLE, data));
  }

  async removeUserRole(data: RemoveUserRoleRequest) {
    return lastValueFrom(this.userClient.send(UserMessage.RBAC.REMOVE_USER_ROLE, data));
  }

  async getUserEffectivePermissions(userId: string) {
    return lastValueFrom(
      this.userClient.send(UserMessage.GET_PERMISSIONS, { userId })
    );
  }

  async getUserRoles(userId: string) {
    return lastValueFrom(
      this.userClient.send(UserMessage.GET_USER_ROLES, { userId })
    );
  }

  async processClerkWebhook(payload: unknown) {
    return lastValueFrom(
      this.userClient.send(UserMessage.AUTH.PROCESS_CLERK_WEBHOOK, payload)
    );
  }

  
}
