import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';

export interface RequestContextMetadata {
  correlationId: string;
  requestId: string;
  userId?: string;
}

export interface StructuredLogEntry {
  timestamp?: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  environment?: string;
  correlationId?: string;
  requestId?: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  message: string;
  durationMs?: number;
  httpStatus?: number;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

type RequestLike = {
  headers?: Record<string, unknown>;
  user?: { id?: string };
  userId?: string;
  requestContext?: Partial<RequestContextMetadata>;
  method?: string;
  originalUrl?: string;
  url?: string;
  route?: { path?: string };
};

const SENSITIVE_KEYS = [
  'authorization',
  'cookie',
  'password',
  'secret',
  'token',
  'hash',
  'signature',
];

function normalizeHeaderValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return normalizeHeaderValue(value[0]);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  return undefined;
}

function shouldRedactKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEYS.some((token) => normalized.includes(token));
}

export function sanitizeForLogging(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>()
): unknown {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.length > 500 ? `${value.slice(0, 500)}...[truncated]` : value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (depth >= 4) {
    return '[max-depth]';
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeForLogging(item, depth + 1, seen));
  }

  if (typeof value === 'object') {
    if (seen.has(value as object)) {
      return '[circular]';
    }

    seen.add(value as object);

    const result: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      result[key] = shouldRedactKey(key)
        ? '[redacted]'
        : sanitizeForLogging(nestedValue, depth + 1, seen);
    }

    return result;
  }

  return String(value);
}

export function createRequestContext(
  context?: Partial<RequestContextMetadata>
): RequestContextMetadata {
  return {
    correlationId: context?.correlationId || randomUUID(),
    requestId: context?.requestId || randomUUID(),
    userId: context?.userId,
  };
}

export function extractRequestContextFromRequest(
  request?: RequestLike
): RequestContextMetadata {
  const existing = request?.requestContext;
  return createRequestContext({
    correlationId:
      existing?.correlationId ||
      normalizeHeaderValue(request?.headers?.[CORRELATION_ID_HEADER]),
    requestId:
      existing?.requestId ||
      normalizeHeaderValue(request?.headers?.[REQUEST_ID_HEADER]),
    userId: existing?.userId || request?.user?.id || request?.userId,
  });
}

export function extractRequestContextFromPayload(
  payload?: Record<string, unknown>
): RequestContextMetadata {
  const meta =
    payload && typeof payload['_meta'] === 'object'
      ? (payload['_meta'] as Partial<RequestContextMetadata>)
      : undefined;

  return createRequestContext({
    correlationId: meta?.correlationId,
    requestId: meta?.requestId,
    userId:
      meta?.userId ||
      (typeof payload?.['userId'] === 'string' ? payload['userId'] : undefined),
  });
}

export function attachRequestContextToPayload<T extends Record<string, unknown>>(
  payload: T,
  request?: RequestLike,
  overrides?: Partial<RequestContextMetadata>
): T & { _meta: RequestContextMetadata } {
  const baseContext = request
    ? extractRequestContextFromRequest(request)
    : createRequestContext();

  return {
    ...payload,
    _meta: createRequestContext({
      ...baseContext,
      ...overrides,
    }),
  };
}

export function resolveHttpAction(request?: RequestLike): string {
  const method = request?.method?.toUpperCase() || 'HTTP';
  const path = request?.route?.path || request?.originalUrl || request?.url || '/';
  return `${method} ${path}`;
}

export function resolveRpcAction(pattern: unknown): string {
  if (typeof pattern === 'string') {
    return pattern;
  }

  if (pattern && typeof pattern === 'object') {
    if ('pattern' in (pattern as Record<string, unknown>)) {
      return String((pattern as Record<string, unknown>)['pattern']);
    }

    return JSON.stringify(sanitizeForLogging(pattern));
  }

  return 'rpc.unknown';
}

export function serializeStructuredLog(entry: StructuredLogEntry): string {
  return JSON.stringify(
    sanitizeForLogging({
      timestamp: entry.timestamp || new Date().toISOString(),
      environment: entry.environment || process.env['NODE_ENV'] || 'development',
      ...entry,
    })
  );
}
