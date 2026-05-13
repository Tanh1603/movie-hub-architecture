import { Injectable, CanActivate, ExecutionContext, Inject, Logger } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
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
} from '@movie-hub/shared-types';
import { lastValueFrom } from 'rxjs';
import { TokenValidationService } from '../auth/token-validation.service';
import { BruteForceProtectionService } from '../auth/brute-force-protection.service';
import { Request } from 'express';
import { createHash } from 'crypto';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  private static readonly ROLE_PRECEDENCE: AppRole[] = [
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
  ];

  constructor(
    private readonly reflector: Reflector,
    @Inject(SERVICE_NAME.USER) private readonly userClient: ClientProxy,
    private readonly tokenValidationService: TokenValidationService,
    private readonly bruteForceProtectionService: BruteForceProtectionService
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
      throw new UnauthorizedException('Authentication token is required');
    }

    const accountKey = this.tokenValidationService.extractAccountKey(token);

    try {
      await this.bruteForceProtectionService.assertNotLocked(request, accountKey);
      const session = await this.tokenValidationService.validateTokenOrThrow(token);
      request.userId = session.sub;
      request.headers['x-user-id'] = session.sub;
      await this.bruteForceProtectionService.clearFailures(request, accountKey);
    } catch (error) {
      await this.bruteForceProtectionService.recordFailure(
        request,
        accountKey,
        correlationId
      );
      this.logger.warn(
        `Token verification failed account=${this.fingerprint(accountKey)} correlationId=${correlationId}`
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
                request.headers['x-user-role'] = String(staffResult.data.position);
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
          `Missing permission userId=${userId} required=${JSON.stringify(requiredPermission)} correlationId=${correlationId}`
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
    const normalizedAction = required.action.toLowerCase();
    const normalizedScope = (required.scope || 'global').toLowerCase();
    const candidates = new Set<string>([
      `${required.resource.toLowerCase()}:${normalizedAction}:${normalizedScope}`,
      `${required.resource.toLowerCase()}:${normalizedAction}`,
    ]);

    return userPermissions.some((permission) => candidates.has(permission));
  }

  private pickEffectiveRole(userRoles: string[]): AppRole | null {
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      return null;
    }

    for (const role of ClerkAuthGuard.ROLE_PRECEDENCE) {
      if (userRoles.includes(role)) {
        return role;
      }
    }

    return null;
  }

  private fingerprint(value: string): string {
    return createHash('sha256').update(value).digest('hex').slice(0, 12);
  }
}
