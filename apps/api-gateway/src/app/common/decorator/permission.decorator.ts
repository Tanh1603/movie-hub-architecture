import { SetMetadata } from '@nestjs/common';
import { PermissionRequirement } from '@movie-hub/shared-types';
export const PERMISSION_KEY = 'permission';

export const Permission = (permission: PermissionRequirement) =>
  SetMetadata(PERMISSION_KEY, permission);
