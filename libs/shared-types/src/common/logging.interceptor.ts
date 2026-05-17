import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
  RequestContextMetadata,
  extractRequestContextFromPayload,
  extractRequestContextFromRequest,
  resolveHttpAction,
  resolveRpcAction,
  sanitizeForLogging,
  serializeStructuredLog,
} from './observability.util';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger: Logger;
  private readonly serviceName: string;
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
    this.serviceName = name;
    this.logger = new Logger(name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const contextType = context.getType();
    let payload: unknown;
    let action = `${contextType}.unknown`;
    let httpStatus: number | undefined;
    let responseHeaders:
      | {
          setHeader?: (name: string, value: string) => void;
          statusCode?: number;
        }
      | undefined;
    let requestContext: RequestContextMetadata = {
      correlationId: undefined as unknown as string,
      requestId: undefined as unknown as string,
      userId: undefined,
    };

    switch (contextType) {
      case 'http': {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const extractedContext = extractRequestContextFromRequest(request);

        request.requestContext = extractedContext;
        request.headers = request.headers || {};
        request.headers[CORRELATION_ID_HEADER] = extractedContext.correlationId;
        request.headers[REQUEST_ID_HEADER] = extractedContext.requestId;

        response?.setHeader?.(
          CORRELATION_ID_HEADER,
          extractedContext.correlationId
        );
        response?.setHeader?.(REQUEST_ID_HEADER, extractedContext.requestId);

        requestContext = extractedContext;
        payload = {
          body: request.body,
          params: request.params,
          query: request.query,
        };
        action = resolveHttpAction(request);
        responseHeaders = response;
        break;
      }
      case 'rpc': {
        const rpcContext = context.switchToRpc().getContext();
        const pattern =
          rpcContext?.pattern ??
          rpcContext?.args?.[1] ??
          context.getArgByIndex(1);
        payload = context.switchToRpc().getData();
        requestContext = extractRequestContextFromPayload(
          (payload as Record<string, unknown>) || {}
        );
        action = resolveRpcAction(pattern);
        break;
      }
      default:
        payload = context.getArgs();
        action = `${contextType}.handler`;
    }

    const now = Date.now();
    this.logger.debug(
      serializeStructuredLog({
        level: 'debug',
        service: this.serviceName,
        correlationId: requestContext.correlationId,
        requestId: requestContext.requestId,
        userId: requestContext.userId,
        action,
        message: 'Request started',
        metadata: {
          contextType,
          payload: sanitizeForLogging(payload),
        },
      })
    );

    return next.handle().pipe(
      tap({
        next: (response) => {
          const responseTime = Date.now() - now;
          httpStatus = responseHeaders?.statusCode;

          this.logger.log(
            serializeStructuredLog({
              level: 'info',
              service: this.serviceName,
              correlationId: requestContext.correlationId,
              requestId: requestContext.requestId,
              userId: requestContext.userId,
              action,
              httpStatus,
              durationMs: responseTime,
              message: 'Request completed',
              metadata: {
                contextType,
                response: sanitizeForLogging(response),
              },
            })
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          httpStatus =
            error?.status || error?.statusCode || responseHeaders?.statusCode;
          this.logger.error(
            serializeStructuredLog({
              level: 'error',
              service: this.serviceName,
              correlationId: requestContext.correlationId,
              requestId: requestContext.requestId,
              userId: requestContext.userId,
              action,
              httpStatus,
              durationMs: responseTime,
              errorCode:
                error?.code ||
                error?.name ||
                String(httpStatus || 'UNHANDLED_ERROR'),
              message: error?.message || 'Request failed',
              metadata: {
                contextType,
                error: sanitizeForLogging(error),
              },
            }),
            error?.stack
          );
        },
      })
    );
  }
}
