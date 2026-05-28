export interface RolePermissionView {
  role: string;
  permissions: string[];
}

export interface PermissionView {
  name: string;
  resource: string;
  action: string;
  scope: string;
}

export interface UpsertRolePermissionsRequest {
  role: string;
  permissions: string[];
}

export interface AssignUserRoleRequest {
  userId: string;
  role: string;
}

export interface RemoveUserRoleRequest {
  userId: string;
  role: string;
}
