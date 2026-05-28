import { HealthCheckError } from './health.type';

/**
 * Sanitizes any JavaScript error to safe HealthCheckError format.
 * Strips raw error internals: no stack traces, SQL, connection strings, or stack depth.
 * Serializes unknown error objects safely for health probe responses.
 *
 * @param error - Unknown error object from probe checks
 * @returns Safe HealthCheckError with generic message
 */
export function sanitizeHealthError(error: unknown): HealthCheckError {
  if (error instanceof Error) {
    const code = error.constructor.name;
    const message =
      error.message && error.message.length < 100
        ? error.message
        : 'Service health check failed';
    return { code, message };
  }

  if (typeof error === 'string') {
    return { code: 'ERROR', message: error.substring(0, 100) };
  }

  return { code: 'UNKNOWN', message: 'Unknown health check error' };
}
