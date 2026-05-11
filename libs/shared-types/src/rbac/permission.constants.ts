export const PermissionResource = {
  USER: 'user',
  BOOKING: 'booking',
  PAYMENT: 'payment',
  TICKET: 'ticket',
  REFUND: 'refund',
  SHOWTIME: 'showtime',
  CINEMA: 'cinema',
  MOVIE: 'movie',
  DASHBOARD: 'dashboard',
  RBAC: 'rbac',
  CONFIG: 'config',
} as const;

export const PermissionAction = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  VALIDATE: 'validate',
  MANAGE: 'manage',
} as const;

export const PermissionScope = {
  OWN: 'own',
  CINEMA: 'cinema',
  GLOBAL: 'global',
} as const;

export type PermissionResourceValue =
  (typeof PermissionResource)[keyof typeof PermissionResource];
export type PermissionActionValue =
  (typeof PermissionAction)[keyof typeof PermissionAction];
export type PermissionScopeValue =
  (typeof PermissionScope)[keyof typeof PermissionScope];

export type PermissionRequirement = {
  resource: PermissionResourceValue;
  action: PermissionActionValue;
  scope?: PermissionScopeValue;
};
