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
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  MANAGE_RESERVATIONS = 'MANAGE_RESERVATIONS',

  // Others
  MANAGE_CONCESSIONS = 'MANAGE_CONCESSIONS',
  MANAGE_TICKETS = 'MANAGE_TICKETS',
}

export const PERMISSION_MAP: Record<AdminPermission, string[]> = {
  [AdminPermission.MANAGE_CINEMAS]: ['cinema:update:cinema', 'cinema:update:global', 'cinema:manage:global'],
  [AdminPermission.VIEW_ALL_CINEMAS]: ['cinema:read:cinema', 'cinema:read:global'],
  [AdminPermission.MANAGE_MOVIES]: ['movie:update:cinema', 'movie:update:global'],
  [AdminPermission.MANAGE_SHOWTIMES]: ['showtime:update:cinema', 'showtime:update:global'],
  [AdminPermission.VIEW_SHOWTIMES]: ['showtime:read:cinema', 'showtime:read:global', 'showtime:read:own'],
  [AdminPermission.MANAGE_STAFF]: ['user:update:global', 'user:update:cinema', 'rbac:update:global'],
  [AdminPermission.VIEW_REPORTS]: ['dashboard:read:global', 'dashboard:read:cinema'],
  [AdminPermission.VIEW_DASHBOARD]: ['dashboard:read:global', 'dashboard:read:cinema'],
  [AdminPermission.MANAGE_RESERVATIONS]: ['booking:update:cinema', 'booking:update:own', 'booking:manage:own'],
  [AdminPermission.MANAGE_CONCESSIONS]: ['booking:update:cinema', 'booking:update:own'],
  [AdminPermission.MANAGE_TICKETS]: ['ticket:update:cinema', 'ticket:validate:cinema'],
};

export const hasPermission = (
  role: AppRole | undefined,
  permission: AdminPermission,
  userPermissions: string[] = []
): boolean => {
  if (!role) return false;
  if (role === AppRole.ADMIN) return true;

  if (userPermissions && userPermissions.length > 0) {
    const candidates = PERMISSION_MAP[permission] || [];
    return userPermissions.some((up) => {
      const parts = up.split(':');
      if (parts.length < 2) return false;
      const resource = parts[0].toLowerCase();
      const action = parts[1].toLowerCase();
      const scope = (parts[2] || 'global').toLowerCase();

      return candidates.some((candidate) => {
        const cParts = candidate.split(':');
        const cResource = cParts[0].toLowerCase();
        const cAction = cParts[1].toLowerCase();
        const cScope = (cParts[2] || 'global').toLowerCase();

        if (resource !== cResource) return false;

        const matchesAction =
          action === cAction ||
          action === 'manage' ||
          (action === 'update' && cAction === 'read');

        if (!matchesAction) return false;

        if (scope === 'global') return true;
        if (scope === 'cinema' && (cScope === 'cinema' || cScope === 'own')) return true;
        if (scope === 'own' && cScope === 'own') return true;

        return false;
      });
    });
  }

  return false;
};
