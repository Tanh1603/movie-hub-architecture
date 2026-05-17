import { SetMetadata } from '@nestjs/common';
import { AppRole } from '@movie-hub/shared-types';

export const ROLE_KEY = 'required_roles';
export const Roles = (...roles: AppRole[]) =>
  SetMetadata(ROLE_KEY, roles);

