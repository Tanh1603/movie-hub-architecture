import { makeCounterProvider } from '@willsoto/nestjs-prometheus';
import { SECURITY_METRICS } from '@movie-hub/shared-types';

export const securityMetricProviders = [
  makeCounterProvider({
    name: SECURITY_METRICS.CLERK_SYNC_DRIFT,
    help: 'Total number of clerk sync drifts detected',
    labelNames: ['direction'],
  }),
  makeCounterProvider({
    name: SECURITY_METRICS.CLERK_SYNC_RETRY_EXHAUSTED,
    help: 'Total number of clerk syncs that exhausted all retries',
  }),
];
