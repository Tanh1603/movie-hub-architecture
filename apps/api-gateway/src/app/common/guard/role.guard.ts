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
  private static readonly KNOWN_ROLES = new Set<string>([
    AppRole.SUPER_ADMIN,
    AppRole.ADMIN,
    AppRole.CINEMA_MANAGER,
    AppRole.ASSISTANT_MANAGER,
    AppRole.TICKET_CLERK,
    AppRole.CONCESSION_STAFF,
    AppRole.USHER,
    AppRole.PROJECTIONIST,
    AppRole.CLEANER,
    AppRole.SECURITY,
    AppRole.CUSTOMER,
  ]);

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
      this.hasRoleByPolicy(userRole, role)
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
    if (typeof rawRole !== 'string' || rawRole.length === 0) {
      return null;
    }

    if (!RoleGuard.KNOWN_ROLES.has(rawRole)) {
      return null;
    }

    if (rawRole === AppRole.CUSTOMER) {
      return AppRole.CUSTOMER;
    }

    if (rawRole === AppRole.ADMIN || rawRole === AppRole.SUPER_ADMIN) {
      return AppRole.ADMIN;
    }

    if (rawRole === AppRole.CINEMA_MANAGER) {
      return AppRole.CINEMA_MANAGER;
    }

    return rawRole as AppRole;
  }

  private hasRoleByPolicy(actual: AppRole, required: AppRole): boolean {
    if (actual === required) {
      return true;
    }

    if (actual === AppRole.ADMIN) {
      return true;
    }

    // Cinema manager has full authority within cinema operational roles.
    if (actual === AppRole.CINEMA_MANAGER) {
      return (
        required === AppRole.ASSISTANT_MANAGER ||
        required === AppRole.TICKET_CLERK ||
        required === AppRole.CONCESSION_STAFF ||
        required === AppRole.USHER ||
        required === AppRole.PROJECTIONIST ||
        required === AppRole.CLEANER ||
        required === AppRole.SECURITY
      );
    }

    // Assistant manager can act on front-line operational roles.
    if (actual === AppRole.ASSISTANT_MANAGER) {
      return (
        required === AppRole.TICKET_CLERK ||
        required === AppRole.CONCESSION_STAFF ||
        required === AppRole.USHER ||
        required === AppRole.PROJECTIONIST ||
        required === AppRole.CLEANER ||
        required === AppRole.SECURITY
      );
    }

    return false;
  }
}
