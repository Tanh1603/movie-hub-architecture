import { clerkClient } from '@clerk/clerk-sdk-node';
import { CanActivate, ExecutionContext, Inject, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import { PERMISSION_KEY } from '../decorator/permission.decorator';
import { SERVICE_NAME, UserMessage } from '@movie-hub/shared-types';
import { lastValueFrom } from 'rxjs';

export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  constructor(
    private reflector: Reflector,
    @Inject(SERVICE_NAME.USER) private userClient: ClientProxy
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // ====== 1️⃣ Check if permission is required ======
    const requiredPermission = this.reflector.get<string>(
      PERMISSION_KEY,
      context.getHandler()
    );

    // ====== 2️⃣ Auth via Clerk - Check both cookie and Authorization header ======
    let token = request.cookies?.__session;

    // Fallback to Authorization header if no cookie
    if (!token) {
      const authHeader = request.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
        this.logger.debug('Token found in Authorization header');
      }
    } else {
      this.logger.debug('Token found in __session cookie');
    }

    if (!token) {
      this.logger.warn(
        'No token found in __session cookie or Authorization header'
      );
      return false;
    }

    try {
      const session = await clerkClient.verifyToken(token);
      request.userId = session.sub;
      this.logger.debug(`User authenticated: ${session.sub}`);
    } catch (err) {
      this.logger.error('Clerk verification failed', {
        error: err.message,
        reason: err.reason,
        tokenPrefix: token.substring(0, 20) + '...',
      });
      // Token might be from wrong Clerk instance (test vs production)
      return false;
    }

    // ====== 3️⃣ If no permission required, just return true after auth ======

    // Enrichment: Fetch Staff Context (CinemaID, Role)
    if (request.userId) {
      try {
        const userDetail = await lastValueFrom(
          this.userClient.send(UserMessage.GET_USER_DETAIL, request.userId)
        );

        if (userDetail?.email) {
          try {
            const staffResult = await lastValueFrom(
              this.userClient.send(
                UserMessage.STAFF.FIND_BY_EMAIL,
                userDetail.email
              )
            );

            if (staffResult?.data) {
              request.staffContext = {
                staffId: staffResult.data.id,
                cinemaId: staffResult.data.cinemaId,
                role: staffResult.data.position, // MANAGER, STAFF, etc.
              };
              this.logger.debug(
                `Staff context attached: ${JSON.stringify(
                  request.staffContext
                )}`
              );
            }
          } catch (e) {
            this.logger.debug(
              `User ${userDetail.email} is not a staff member: ${e.message}`
            );
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to enrich user context: ${error.message}`);
      }
    }

    if (!requiredPermission) {
      this.logger.debug(
        `No permission required, user ${request.userId} authenticated successfully`
      );
      return true;
    }

    // ====== 4️⃣ Permission check ======
    const userId = request.userId;
    if (!userId) {
      this.logger.warn('No userId found after token verification');
      return false;
    }

    try {
      this.logger.debug(`Checking permissions for user ${userId}`);
      const permissions: string[] = await lastValueFrom(
        this.userClient.send<string[], { userId: string }>(
          UserMessage.GET_PERMISSIONS,
          { userId }
        )
      );

      this.logger.debug(
        `User ${userId} permissions: ${JSON.stringify(permissions)}`
      );
      const hasPermission = permissions.includes(requiredPermission);

      if (!hasPermission) {
        this.logger.warn(
          `User ${userId} missing required permission: ${requiredPermission}`
        );
      }

      return hasPermission;
    } catch (error) {
      this.logger.error(`Permission check failed for user ${userId}:`, {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }
}
