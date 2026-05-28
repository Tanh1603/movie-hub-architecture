import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
  createRequestContext,
  RequestContextMetadata,
} from '@movie-hub/shared-types/common';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const correlationId = this.resolveHeaderValue(
      req.headers?.[CORRELATION_ID_HEADER]
    ) || randomUUID();
    const requestId = this.resolveHeaderValue(req.headers?.[REQUEST_ID_HEADER]) || randomUUID();
    const userId = req.user?.id || req.headers?.['x-user-id'];

    const requestContext: RequestContextMetadata = createRequestContext({
      correlationId,
      requestId,
      userId: typeof userId === 'string' ? userId : undefined,
    });

    req.requestContext = requestContext;
    req.headers = req.headers || {};
    req.headers[CORRELATION_ID_HEADER] = correlationId;
    req.headers[REQUEST_ID_HEADER] = requestId;

    res?.setHeader?.(CORRELATION_ID_HEADER, correlationId);
    res?.setHeader?.(REQUEST_ID_HEADER, requestId);

    next();
  }

  private resolveHeaderValue(value: unknown): string | undefined {
    if (Array.isArray(value)) {
      return this.resolveHeaderValue(value[0]);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }

    return undefined;
  }
}
