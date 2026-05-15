import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

const SENSITIVE_KEYS = [
  'authorization',
  'x-api-key',
  'password',
  'cardnumber',
  'cvv',
  'pin',
  'refreshtoken',
  'accesstoken',
];

export function redactSensitiveData(data: any): any {
  if (!data) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(redactSensitiveData);

  const redacted = { ...data };
  for (const key in redacted) {
    if (Object.prototype.hasOwnProperty.call(redacted, key)) {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object') {
        redacted[key] = redactSensitiveData(redacted[key]);
      }
    }
  }
  return redacted;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger: Logger;

  constructor(name: string) {
    this.logger = new Logger(name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const contextType = context.getType();
    let payload;
    let logPrefix = '';

    switch (contextType) {
      case 'http': {
        const request = context.switchToHttp().getRequest();
        payload = request.body;
        logPrefix = `HTTP ${request.method} ${request.url}`;
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
    this.logger.debug(
      `[${logPrefix}] Incoming request with body: ${JSON.stringify(redactSensitiveData(payload))}`
    );

    return next.handle().pipe(
      tap({
        next: (response) => {
          const responseTime = Date.now() - now;
          this.logger.debug(
            `[${logPrefix}] Response (${responseTime}ms): ${JSON.stringify(
              redactSensitiveData(response)
            )}`
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;

          const errorContent =
            error instanceof Error
              ? { ...error, message: error.message, stack: error.stack }
              : error;

          this.logger.error(
            `[${logPrefix}] Error (${responseTime}ms): ${JSON.stringify(
              redactSensitiveData(errorContent)
            )}`
          );
        },
      })
    );
  }
}
