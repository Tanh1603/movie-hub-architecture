import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { TokenValidationService } from '../auth/token-validation.service';

/**
 * Optional authentication guard that extracts userId if token is present,
 * but allows the request to proceed even without authentication.
 */
@Injectable()
export class OptionalClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalClerkAuthGuard.name);

  constructor(private readonly tokenValidationService: TokenValidationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    let token = request.cookies?.__session;
    if (!token) {
      const authHeader = request.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return true;
    }

    try {
      const session = await this.tokenValidationService.validateTokenOrThrow(token);
      request.userId = session.sub;
      request.headers['x-user-id'] = session.sub;
      request.headers['x-user-role'] = request.headers['x-user-role'] || 'CUSTOMER';
    } catch {
      this.logger.debug('Optional auth token rejected; proceeding unauthenticated');
    }

    return true;
  }
}
