import { Injectable, CanActivate, ExecutionContext, Inject, Logger } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import {
  PERMISSION_KEY,
} from '../decorator/permission.decorator';
import {
  AppRole,
  PermissionRequirement,
  SERVICE_NAME,
  UserMessage,
  SECURITY_METRICS,
} from '@movie-hub/shared-types';
import { lastValueFrom } from 'rxjs';
import { TokenValidationService } from '../auth/token-validation.service';
import { BruteForceProtectionService } from '../auth/brute-force-protection.service';
import { Request } from 'express';
import { createHash } from 'crypto';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  private static readonly ROLE_PRECEDENCE: AppRole[] = [
    AppRole.ADMIN,
    AppRole.CINEMA_MANAGER,
    AppRole.STAFF,
    AppRole.CUSTOMER,
  ];

  constructor(
    private readonly reflector: Reflector,
    @Inject(SERVICE_NAME.USER) private readonly userClient: ClientProxy,
    private readonly tokenValidationService: TokenValidationService,
    private readonly bruteForceProtectionService: BruteForceProtectionService,
    @InjectMetric(SECURITY_METRICS.AUTH_FAILURES)
    private readonly authFailuresCounter: Counter<string>,
    @InjectMetric(SECURITY_METRICS.BRUTE_FORCE_LOCKOUTS)
    private readonly bruteForceLockoutsCounter: Counter<string>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & Record<string, any>>();
    const correlationId = this.getCorrelationId(request);
    request.headers['x-correlation-id'] = correlationId;

    const requiredPermission =
      this.reflector.getAllAndOverride<PermissionRequirement>(PERMISSION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    const token = this.extractToken(request);
    if (!token) {
      this.logger.warn(`Missing auth token correlationId=${correlationId}`);
      this.authFailuresCounter.inc({ reason: 'missing' });
      throw new UnauthorizedException('Authentication token is required');
    }

    const accountKey = this.tokenValidationService.extractAccountKey(token);

    try {
      await this.bruteForceProtectionService.assertNotLocked(request, accountKey);
    } catch (lockError) {
      if (lockError instanceof Error && lockError.message === 'AUTH_TEMPORARILY_LOCKED') {
        this.logger.warn(
          `Auth lockout active account=${this.fingerprint(accountKey)} correlationId=${correlationId}`
        );
        this.authFailuresCounter.inc({ reason: 'lockout' });
        this.bruteForceLockoutsCounter.inc({ endpoint: request.path ?? 'unknown' });
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many failed attempts. Please try again later.',
            retryAfter: this.bruteForceProtectionService.getLockDurationSeconds(),
          },
          HttpStatus.TOO_MANY_REQUESTS,
          {
            cause: lockError,
          }
        );
      }
      throw lockError;
    }

    try {
      const session = await this.tokenValidationService.validateTokenOrThrow(token);
      request.userId = session.sub;
      request.headers['x-user-id'] = session.sub;
      await this.bruteForceProtectionService.clearFailures(request, accountKey);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      await this.bruteForceProtectionService.recordFailure(
        request,
        accountKey,
        correlationId
      );
      this.authFailuresCounter.inc({ reason: 'invalid_token' });
      this.logger.warn(
        `Token verification failed account=${this.fingerprint(accountKey)} error=${error instanceof Error ? error.message : String(error)} correlationId=${correlationId}`
      );
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    if (request.userId) {
      try {
        const [userRoles, userDetail] = await Promise.all([
          lastValueFrom(
            this.userClient.send<string[], { userId: string }>(
              UserMessage.GET_USER_ROLES,
              { userId: request.userId }
            )
          ).catch(() => [] as string[]),
          lastValueFrom(
            this.userClient.send(UserMessage.GET_USER_DETAIL, request.userId)
          ).catch(() => null),
        ]);

        const effectiveRole = this.pickEffectiveRole(userRoles);
        if (effectiveRole) {
          request.userRoles = userRoles;
          request.headers['x-user-role'] = effectiveRole;
        }

        if (userDetail?.email) {
          try {
            const staffResult = await lastValueFrom(
              this.userClient.send(UserMessage.STAFF.FIND_BY_EMAIL, userDetail.email)
            );

            if (staffResult?.data) {
              request.staffContext = {
                staffId: staffResult.data.id,
                cinemaId: staffResult.data.cinemaId,
                role: staffResult.data.position,
              };
              request.headers['x-cinema-id'] = String(staffResult.data.cinemaId);
              if (!request.headers['x-user-role']) {
                request.headers['x-user-role'] = this.mapStaffPositionToAppRole(
                  String(staffResult.data.position)
                );
              }
            }
          } catch {
            // Not a staff account; keep RBAC role or default CUSTOMER role.
          }
        }
      } catch {
        this.logger.warn(`Failed to enrich user context correlationId=${correlationId}`);
      }
    }

    if (!request.headers['x-user-role']) {
      request.headers['x-user-role'] = AppRole.CUSTOMER;
    }

    if (!this.hasValidUserContextHeaders(request)) {
      this.logger.warn(`Invalid user context headers correlationId=${correlationId}`);
      throw new ForbiddenException('Invalid user authentication context');
    }

    if (!requiredPermission) {
      return true;
    }

    const userId = request.userId;
    if (!userId) {
      throw new UnauthorizedException('Unauthenticated request');
    }

    try {
      const permissions: string[] = await lastValueFrom(
        this.userClient.send<string[], { userId: string }>(
          UserMessage.GET_PERMISSIONS,
          { userId }
        )
      );

      const hasPermission = this.hasRequiredPermission(
        permissions,
        requiredPermission
      );
      if (!hasPermission) {
        this.logger.warn(
          `Missing permission userId=${userId} required=${JSON.stringify(requiredPermission)} actualPermissions=[${permissions.join(',')}] correlationId=${correlationId}`
        );
        throw new ForbiddenException('Insufficient permissions');
      }

      return hasPermission;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(
        `Permission check failed userId=${userId} correlationId=${correlationId}`
      );
      throw new ForbiddenException('Unable to validate permissions');
    }
  }

  private extractToken(request: Request & Record<string, any>): string | null {
    const cookieToken = request.cookies?.__session;
    if (typeof cookieToken === 'string' && cookieToken.length > 0) {
      return cookieToken;
    }

    const authHeader = request.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return null;
  }

  private hasValidUserContextHeaders(
    request: Request & Record<string, any>
  ): boolean {
    const userId = request.headers['x-user-id'];
    const userRole = request.headers['x-user-role'];

    return (
      typeof userId === 'string' &&
      userId.startsWith('user_') &&
      typeof userRole === 'string' &&
      userRole.length > 0
    );
  }

  private getCorrelationId(request: Request & Record<string, any>): string {
    const correlationId = request.headers?.['x-correlation-id'];
    if (typeof correlationId === 'string' && correlationId.length > 0) {
      return correlationId;
    }

    return `req-${Date.now()}`;
  }

  private hasRequiredPermission(
    userPermissions: string[],
    required: PermissionRequirement
  ): boolean {
    const rResource = required.resource.toLowerCase();
    const rAction = required.action.toLowerCase();
    const rScope = (required.scope || 'global').toLowerCase();

    return userPermissions.some((up) => {
      const parts = up.split(':');
      if (parts.length < 2) return false;
      const resource = parts[0].toLowerCase();
      const action = parts[1].toLowerCase();
      const scope = (parts[2] || 'global').toLowerCase();

      if (resource !== rResource) return false;

      const matchesAction =
        action === rAction ||
        action === 'manage' ||
        (action === 'update' && rAction === 'read') ||
        (action === 'create' && rAction === 'read'); // create usually implies read in some contexts, but let's stick to manage/update

      if (!matchesAction) return false;

      // Scope inheritance: global > cinema > own
      if (scope === 'global') return true;
      if (scope === 'cinema' && (rScope === 'cinema' || rScope === 'own')) return true;
      if (scope === 'own' && rScope === 'own') return true;

      return false;
    });
  }

  private pickEffectiveRole(userRoles: string[]): AppRole | null {
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      return null;
    }

    if (userRoles.includes(AppRole.ADMIN)) {
      return AppRole.ADMIN;
    }

    return (
      ClerkAuthGuard.ROLE_PRECEDENCE.find((role) => userRoles.includes(role)) ||
      null
    );
  }

  private mapStaffPositionToAppRole(position: string): AppRole {
    if (position === AppRole.ADMIN) {
      return AppRole.ADMIN;
    }
    const role = position as AppRole;
    return ClerkAuthGuard.ROLE_PRECEDENCE.includes(role)
      ? role
      : AppRole.STAFF;
  }

  private fingerprint(value: string): string {
    return createHash('sha256').update(value).digest('hex').slice(0, 12);
  }
}
