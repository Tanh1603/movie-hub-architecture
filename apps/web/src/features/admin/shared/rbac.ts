import { AppRole } from '@movie-hub/shared-types';

export enum AdminPermission {
  // Cinema Management
  MANAGE_CINEMAS = 'MANAGE_CINEMAS',
  VIEW_ALL_CINEMAS = 'VIEW_ALL_CINEMAS',

  // Movies
  MANAGE_MOVIES = 'MANAGE_MOVIES',

  // Showtimes
  MANAGE_SHOWTIMES = 'MANAGE_SHOWTIMES',
  VIEW_SHOWTIMES = 'VIEW_SHOWTIMES',

  // Staff
  MANAGE_STAFF = 'MANAGE_STAFF',

  // Booking & Reports
  VIEW_REPORTS = 'VIEW_REPORTS',
  MANAGE_RESERVATIONS = 'MANAGE_RESERVATIONS',

  // Others
  MANAGE_CONCESSIONS = 'MANAGE_CONCESSIONS',
  MANAGE_TICKETS = 'MANAGE_TICKETS',
}

export const ROLE_PERMISSIONS: Record<AppRole, AdminPermission[]> = {
  [AppRole.ADMIN]: [
    AdminPermission.MANAGE_CINEMAS,
    AdminPermission.VIEW_ALL_CINEMAS,
    AdminPermission.MANAGE_MOVIES,
    AdminPermission.MANAGE_SHOWTIMES,
    AdminPermission.VIEW_SHOWTIMES,
    AdminPermission.MANAGE_STAFF,
    AdminPermission.VIEW_REPORTS,
    AdminPermission.MANAGE_RESERVATIONS,
    AdminPermission.MANAGE_CONCESSIONS,
    AdminPermission.MANAGE_TICKETS,
  ],
  [AppRole.CINEMA_MANAGER]: [
    AdminPermission.MANAGE_SHOWTIMES,
    AdminPermission.VIEW_SHOWTIMES,
    AdminPermission.VIEW_REPORTS,
    AdminPermission.MANAGE_RESERVATIONS,
    AdminPermission.MANAGE_STAFF, // Only their own cinema
  ],
  [AppRole.STAFF]: [
    AdminPermission.VIEW_SHOWTIMES,
    AdminPermission.MANAGE_RESERVATIONS,
  ],
  [AppRole.CUSTOMER]: [],
};

export const hasPermission = (
  role: AppRole | undefined,
  permission: AdminPermission
): boolean => {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};
