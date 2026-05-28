import { Global, Module } from '@nestjs/common';
import { createSecurityCounterProvider, SharedMetricsModule } from '@movie-hub/shared-metrics';
import { SECURITY_METRICS } from '@movie-hub/shared-types';

export const securityMetricProviders = [
  createSecurityCounterProvider(
    SECURITY_METRICS.WEBHOOK_SIGNATURE_FAIL,
    'Total number of webhook signature validation failures',
    ['provider']
  ),
  createSecurityCounterProvider(
    SECURITY_METRICS.WEBHOOK_REPLAY_DETECTED,
    'Total number of webhook replays detected',
    ['provider']
  ),
  createSecurityCounterProvider(
    SECURITY_METRICS.WEBHOOK_STALE_REJECTED,
    'Total number of stale webhooks rejected',
    ['provider']
  ),
  createSecurityCounterProvider(
    SECURITY_METRICS.NOTIFICATION_OUTBOX_DEAD_LETTER,
    'Total number of notifications moved to dead letter',
    ['event_type']
  ),
  createSecurityCounterProvider(
    SECURITY_METRICS.NOTIFICATION_DISPATCH_FAILURE,
    'Total number of notification dispatch failures',
    ['provider']
  ),
];

@Global()
@Module({
  imports: [SharedMetricsModule],
  providers: securityMetricProviders,
  exports: securityMetricProviders,
})
export class SecurityMetricsModule {}
