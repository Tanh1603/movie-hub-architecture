import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger: Logger;
  // Paths to exclude from detailed logging
  private readonly excludedPaths = new Set([
    '/metrics',
    '/api/metrics',
    '/health',
    '/api/health',
    '/api/health/live',
    '/api/health/ready',
  ]);

  constructor(name: string) {
    this.logger = new Logger(name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const contextType = context.getType();
    let payload;
    let logPrefix = '';
    let shouldLog = true;

    switch (contextType) {
      case 'http': {
        const request = context.switchToHttp().getRequest();
        payload = request.body;
        logPrefix = `HTTP ${request.method} ${request.url}`;
        // Check if the path should be excluded from logging
        const url = request.url.split('?')[0]; // Remove query params
        shouldLog = !Array.from(this.excludedPaths).some((excludedPath) =>
          url.includes(excludedPath)
        );
        break;
      }
      case 'rpc': {
        const pattern = context.switchToRpc().getContext().args[1];
        payload = context.switchToRpc().getData();
        logPrefix = `RPC ${JSON.stringify(pattern)}`;
        break;
      }
      default:
        payload = context.getArgs();
        logPrefix = contextType.toUpperCase();
    }

    const now = Date.now();
    if (shouldLog) {
      this.logger.debug(
        `[${logPrefix}] Incoming request with body: ${JSON.stringify(payload)}`
      );
    }

    return next.handle().pipe(
      tap({
        next: (response) => {
          const responseTime = Date.now() - now;
          if (shouldLog) {
            this.logger.debug(
              `[${logPrefix}] Response (${responseTime}ms): ${JSON.stringify(
                response
              )}`
            );
          }
        },
        error: (error) => {
          const responseTime = Date.now() - now;

          const errorContent =
            error instanceof Error
              ? { ...error, message: error.message, stack: error.stack }
              : error;

          if (shouldLog) {
            this.logger.error(
              `[${logPrefix}] Error (${responseTime}ms): ${JSON.stringify(
                errorContent
              )}`
            );
          }
        },
      })
    );
  }
}
