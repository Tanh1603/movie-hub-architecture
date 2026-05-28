import { Inject } from '@nestjs/common';

/**
 * Decorator to inject security metric counters.
 * Used instead of @InjectMetric from @willsoto/nestjs-prometheus
 * because we manage metrics through SharedMetricsModule's registry.
 */
export function InjectSecurityMetric(metricName: string) {
  return Inject(`METRIC_${metricName}`);
}
