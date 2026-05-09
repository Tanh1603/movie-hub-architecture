export enum AppRole {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
  CINEMA_MANAGER = 'CINEMA_MANAGER',
  ADMIN = 'ADMIN',
}

export type PermissionScope = 'own' | 'cinema' | 'global';

export type PermissionRequirement = {
  resource: string;
  action: string;
  scope?: PermissionScope;
};

