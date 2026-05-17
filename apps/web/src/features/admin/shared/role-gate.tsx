'use client';

import React from 'react';
import { useRBAC } from './hooks/use-rbac';
import { AdminPermission } from './rbac';
import { AppRole } from '@movie-hub/shared-types';

interface RoleGateProps {
  children: React.ReactNode;
  requireRole?: AppRole[];
  requirePermission?: AdminPermission;
  fallback?: React.ReactNode;
}

/**
 * A component to conditionally render UI based on the user's role or permissions.
 */
export const RoleGate = ({
  children,
  requireRole,
  requirePermission,
  fallback = null,
}: RoleGateProps) => {
  const { isLoaded, role, hasPermission } = useRBAC();

  if (!isLoaded) {
    return null; // Or a subtle loader if necessary
  }

  if (requireRole && role) {
    if (!requireRole.includes(role)) {
      return fallback;
    }
  }

  if (requirePermission) {
    if (!hasPermission(requirePermission)) {
      return fallback;
    }
  }

  return <>{children}</>;
};
