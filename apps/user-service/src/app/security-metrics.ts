import { createSecurityCounterProvider } from '@movie-hub/shared-metrics';
import { SECURITY_METRICS } from '@movie-hub/shared-types';

export const securityMetricProviders = [
  createSecurityCounterProvider(
    SECURITY_METRICS.CLERK_SYNC_DRIFT,
    'Total number of clerk sync drifts detected',
    ['direction']
  ),
  createSecurityCounterProvider(
    SECURITY_METRICS.CLERK_SYNC_RETRY_EXHAUSTED,
    'Total number of clerk syncs that exhausted all retries'
  ),
];
