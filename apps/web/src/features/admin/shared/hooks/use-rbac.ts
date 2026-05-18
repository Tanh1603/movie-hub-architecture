'use client';

import { useUser } from '@clerk/nextjs';
import { AppRole } from '@movie-hub/shared-types';
import { AdminPermission, hasPermission } from '../rbac';
import { useQuery } from '@tanstack/react-query';
import { rbacApi } from '@/api/services';

export const useRBAC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const role = user?.publicMetadata?.role as AppRole | undefined;
  const cinemaId = user?.publicMetadata?.cinemaId as string | undefined;

  const { data: userPermissions = [], isLoading: isPermissionsLoading, error: permissionsError } = useQuery({
    queryKey: ['my-permissions', user?.id],
    queryFn: () => rbacApi.getMyPermissions(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  if (process.env.NODE_ENV === 'development' && permissionsError) {
    console.error('[RBAC] Failed to fetch permissions:', permissionsError);
  }

  const isAllLoaded = isLoaded && (!user?.id || !isPermissionsLoading);

  return {
    isLoaded: isAllLoaded,
    isSignedIn,
    role,
    cinemaId,
    isAdmin: role === AppRole.ADMIN,
    isCinemaManager: role === AppRole.CINEMA_MANAGER,
    isStaff: role === AppRole.STAFF,
    hasPermission: (permission: AdminPermission) => {
      const result = hasPermission(role, permission, userPermissions);
      if (process.env.NODE_ENV === 'development' && !result && isAllLoaded) {
        console.warn(`[RBAC] Permission denied: ${permission}`, { role, userPermissions });
      }
      return result;
    },
  };
};
