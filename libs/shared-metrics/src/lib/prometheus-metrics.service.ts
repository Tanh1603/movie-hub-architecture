import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';

export interface HttpMetricSample {
  method: string;
  route: string;
  status: string;
  durationSeconds: number;
}

@Injectable()
export class PrometheusMetricsService {
  private readonly registry = new Registry();
  private readonly httpRequestsTotal = new Counter({
    name: 'moviehub_http_requests_total',
    help: 'Total HTTP requests processed by the service.',
    labelNames: ['method', 'route', 'status'],
    registers: [this.registry],
  });
  private readonly httpRequestDurationSeconds = new Histogram({
    name: 'moviehub_http_request_duration_seconds',
    help: 'HTTP request duration in seconds.',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.001, 0.01, 0.1, 1, 5],
    registers: [this.registry],
  });
  private readonly httpRequestsInFlight = new Gauge({
    name: 'moviehub_http_requests_in_flight',
    help: 'Current number of in-flight HTTP requests.',
    labelNames: ['method', 'route'],
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  async metrics(): Promise<string> {
    return this.registry.metrics();
  }

  incrementInFlight(method: string, route: string): void {
    this.httpRequestsInFlight.inc({ method, route });
  }

  decrementInFlight(method: string, route: string): void {
    this.httpRequestsInFlight.dec({ method, route });
  }

  observeHttpRequest(sample: HttpMetricSample): void {
    const labels = {
      method: sample.method,
      route: sample.route,
      status: sample.status,
    };
    this.httpRequestsTotal.inc(labels);
    this.httpRequestDurationSeconds.observe(labels, sample.durationSeconds);
  }
}
