import { Global, Module } from '@nestjs/common';
import { makeCounterProvider } from '@willsoto/nestjs-prometheus';
import { SECURITY_METRICS } from '@movie-hub/shared-types';

export const securityMetricProviders = [
  makeCounterProvider({
    name: SECURITY_METRICS.WEBHOOK_SIGNATURE_FAIL,
    help: 'Total number of webhook signature validation failures',
    labelNames: ['provider'],
  }),
  makeCounterProvider({
    name: SECURITY_METRICS.WEBHOOK_REPLAY_DETECTED,
    help: 'Total number of webhook replays detected',
    labelNames: ['provider'],
  }),
  makeCounterProvider({
    name: SECURITY_METRICS.WEBHOOK_STALE_REJECTED,
    help: 'Total number of stale webhooks rejected',
    labelNames: ['provider'],
  }),
  makeCounterProvider({
    name: SECURITY_METRICS.NOTIFICATION_OUTBOX_DEAD_LETTER,
    help: 'Total number of notifications moved to dead letter',
    labelNames: ['event_type'],
  }),
  makeCounterProvider({
    name: SECURITY_METRICS.NOTIFICATION_DISPATCH_FAILURE,
    help: 'Total number of notification dispatch failures',
    labelNames: ['provider'],
  }),
];

@Global()
@Module({
  providers: securityMetricProviders,
  exports: securityMetricProviders,
})
export class SecurityMetricsModule {}
