'use client';

import { useUser } from '@clerk/nextjs';
import { AppRole } from '@movie-hub/shared-types';
import { AdminPermission, hasPermission } from '../rbac';

export const useRBAC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const role = user?.publicMetadata?.role as AppRole | undefined;
  const cinemaId = user?.publicMetadata?.cinemaId as string | undefined;

  return {
    isLoaded,
    isSignedIn,
    role,
    cinemaId,
    isAdmin: role === AppRole.ADMIN,
    isCinemaManager: role === AppRole.CINEMA_MANAGER,
    isStaff: role === AppRole.STAFF,
    hasPermission: (permission: AdminPermission) => hasPermission(role, permission),
  };
};
