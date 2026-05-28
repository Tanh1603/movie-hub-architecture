import { ClsServiceManager } from 'nestjs-cls';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';

export interface RequestContextMetadata {
  correlationId?: string;
  requestId?: string;
  userId?: string;
}

export function createRequestContext(metadata: RequestContextMetadata): RequestContextMetadata {
  return metadata;
}

export function attachRequestContextToPayload<T extends Record<string, any>>(
  payload: T,
  request?: any
): T & { _meta?: RequestContextMetadata } {
  // Use ClsServiceManager to get the active context automatically
  const cls = ClsServiceManager.getClsService();
  
  const meta: RequestContextMetadata = {
    correlationId: cls.get('correlationId') || request?.headers?.[CORRELATION_ID_HEADER],
    requestId: cls.get('requestId') || request?.headers?.[REQUEST_ID_HEADER],
    userId: cls.get('userId') || request?.user?.id || request?.headers?.['x-user-id'],
  };

  return {
    ...payload,
    _meta: meta,
  };
}

export function extractRequestContextFromPayload(
  payload: any
): RequestContextMetadata | undefined {
  return payload?._meta;
}

export function sanitizeForLogging(obj: any): any {
  if (obj instanceof Error) {
    return obj.message;
  }
  return obj;
}

export function serializeStructuredLog(logPayload: Record<string, any>): any {
  // Since Pino handles structured logging natively, we just return the object directly.
  // The PinoLogger wrapper will automatically process the object into a structured JSON log.
  return logPayload;
}
