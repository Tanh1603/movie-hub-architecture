import { RequestContextMetadata } from '@movie-hub/shared-types/common/observability.util';

export interface BookingRequestContext extends RequestContextMetadata {
  userId?: string;
}

export function resolveBookingRequestContext(
  payload?: Record<string, unknown>
): BookingRequestContext {
  const meta =
    payload && typeof payload['_meta'] === 'object'
      ? (payload['_meta'] as Partial<BookingRequestContext>)
      : undefined;

  return {
    correlationId: meta?.correlationId || '',
    requestId: meta?.requestId || '',
    userId:
      meta?.userId ||
      (typeof payload?.['userId'] === 'string' ? (payload['userId'] as string) : undefined),
  };
}
