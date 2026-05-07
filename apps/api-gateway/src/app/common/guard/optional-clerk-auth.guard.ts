import { clerkClient } from '@clerk/clerk-sdk-node';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';

/**
 * Optional authentication guard that extracts userId if token is present,
 * but allows the request to proceed even without authentication.
 *
 * Use this for endpoints that behave differently for authenticated vs unauthenticated users.
 */
@Injectable()
export class OptionalClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalClerkAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check both cookie and Authorization header
    let token = request.cookies?.__session;

    // Fallback to Authorization header if no cookie
    if (!token) {
      const authHeader = request.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // If no token, allow request but without userId
    if (!token) {
      this.logger.debug('No token found, proceeding as unauthenticated');
      return true;
    }

    try {
      const session = await clerkClient.verifyToken(token);
      request.userId = session.sub;
      this.logger.debug(`Optional auth: User authenticated as ${session.sub}`);
    } catch {
      // Token invalid, but still allow request (unauthenticated)
      this.logger.debug(
        'Token verification failed, proceeding as unauthenticated'
      );
    }

    return true;
  }
}
