import { SetMetadata } from '@nestjs/common';
import { AccessRole } from '../constants/roles.constants';

export const ROLE_KEY = 'required_roles';
export const Roles = (...roles: AccessRole[]) =>
  SetMetadata(ROLE_KEY, roles);

