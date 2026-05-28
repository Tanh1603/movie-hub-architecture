export type RolePermissionView = {
  role: string;
  permissions: string[];
};

export type PermissionView = {
  name: string;
  resource: string;
  action: string;
  scope: string;
};

export type UpsertRolePermissionsRequest = {
  role: string;
  permissions: string[];
};

export type AssignUserRoleRequest = {
  userId: string;
  role: string;
};

export type RemoveUserRoleRequest = {
  userId: string;
  role: string;
};

