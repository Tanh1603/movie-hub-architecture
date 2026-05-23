import { Counter } from 'prom-client';
import { PrometheusMetricsService } from './prometheus-metrics.service';

export function createSecurityCounterProvider(
  name: string,
  help: string,
  labelNames: string[] = []
) {
  return {
    provide: `METRIC_${name}`,
    useFactory: (metricsService: PrometheusMetricsService) => {
      const registry = metricsService.getRegistry();
      
      // Check if metric already exists in registry
      const existing = registry.getSingleMetric(name);
      if (existing) {
        return existing as Counter;
      }
      
      // Create new counter if it doesn't exist
      return new Counter({
        name,
        help,
        labelNames,
        registers: [registry],
      });
    },
    inject: [PrometheusMetricsService],
  };
}
