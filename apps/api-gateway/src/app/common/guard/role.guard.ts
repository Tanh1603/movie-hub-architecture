import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_KEY } from '../decorator/roles.decorator';
import { Request } from 'express';
import { AppRole, SECURITY_METRICS } from '@movie-hub/shared-types';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);
  private static readonly KNOWN_ROLES = new Set<string>([
    AppRole.ADMIN,
    AppRole.CINEMA_MANAGER,
    AppRole.STAFF,
    AppRole.CUSTOMER,
  ]);
  private static readonly ROLE_POLICY: Record<
    AppRole,
    ReadonlySet<AppRole>
  > = {
    [AppRole.ADMIN]: new Set([
      AppRole.ADMIN,
      AppRole.CINEMA_MANAGER,
      AppRole.STAFF,
      AppRole.CUSTOMER,
    ]),
    [AppRole.CINEMA_MANAGER]: new Set([
      AppRole.CINEMA_MANAGER,
      AppRole.STAFF,
      AppRole.CUSTOMER,
    ]),
    [AppRole.STAFF]: new Set([AppRole.STAFF, AppRole.CUSTOMER]),
    [AppRole.CUSTOMER]: new Set([AppRole.CUSTOMER]),
  };

  constructor(
    private readonly reflector: Reflector,
    @InjectMetric(SECURITY_METRICS.RBAC_AUTHORIZATION_DENIED)
    private readonly rbacDeniedCounter: Counter<string>
  ) {}

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
      this.rbacDeniedCounter.inc({ role: 'unknown', resource: context.getClass().name });
      throw new ForbiddenException('Insufficient role');
    }

    const hasRole = requiredRoles.some((role) =>
      this.hasRoleByPolicy(userRole, role)
    );

    if (!hasRole) {
      this.logger.warn(
        `Authorization failed userId=${String(userId)} role=${userRole} required=${requiredRoles.join(',')} action=${action} correlationId=${String(correlationId)}`
      );
      this.rbacDeniedCounter.inc({ role: userRole, resource: context.getClass().name });
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

    return rawRole as AppRole;
  }

  private hasRoleByPolicy(
    actual: AppRole,
    required: AppRole
  ): boolean {
    const allowedRoles = RoleGuard.ROLE_POLICY[actual];
    return allowedRoles ? allowedRoles.has(required) : false;
  }
}

