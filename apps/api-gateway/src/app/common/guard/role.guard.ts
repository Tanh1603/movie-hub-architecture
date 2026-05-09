import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole } from '@movie-hub/shared-types';
import { ROLE_KEY } from '../decorator/roles.decorator';
import { Request } from 'express';

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<AppRole[]>(ROLE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & Record<string, any>>();
    const userId = request.headers['x-user-id'];
    const rawRole = request.headers['x-user-role'];
    const correlationId = request.headers['x-correlation-id'] || `req-${Date.now()}`;
    const action = `${context.getClass().name}.${context.getHandler().name}`;

    const userRole = this.normalizeRole(rawRole);
    if (!userRole) {
      this.logger.warn(
        `Authorization failed userId=${String(userId)} reason=invalid_role role=${String(rawRole)} action=${action} correlationId=${String(correlationId)}`
      );
      throw new ForbiddenException('Insufficient role');
    }

    const hasRole = requiredRoles.some((role) =>
      this.hasRoleByHierarchy(userRole, role)
    );

    if (!hasRole) {
      this.logger.warn(
        `Authorization failed userId=${String(userId)} role=${userRole} required=${requiredRoles.join(',')} action=${action} correlationId=${String(correlationId)}`
      );
      throw new ForbiddenException('Insufficient role');
    }

    this.logger.log(
      `Authorization success userId=${String(userId)} role=${userRole} action=${action} correlationId=${String(correlationId)}`
    );
    return true;
  }

  private normalizeRole(rawRole: unknown): AppRole | null {
    if (rawRole === AppRole.CUSTOMER) {
      return AppRole.CUSTOMER;
    }

    if (rawRole === AppRole.ADMIN || rawRole === 'SUPER_ADMIN') {
      return AppRole.ADMIN;
    }

    if (rawRole === AppRole.CINEMA_MANAGER) {
      return AppRole.CINEMA_MANAGER;
    }

    if (typeof rawRole === 'string' && rawRole.length > 0) {
      return AppRole.STAFF;
    }

    return null;
  }

  private hasRoleByHierarchy(actual: AppRole, required: AppRole): boolean {
    const rank = {
      [AppRole.CUSTOMER]: 1,
      [AppRole.STAFF]: 2,
      [AppRole.CINEMA_MANAGER]: 3,
      [AppRole.ADMIN]: 4,
    };

    return rank[actual] >= rank[required];
  }
}
