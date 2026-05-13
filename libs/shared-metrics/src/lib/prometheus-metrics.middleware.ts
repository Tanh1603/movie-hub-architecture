import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PrometheusMetricsService } from './prometheus-metrics.service';

const METRICS_PATHS = new Set(['/metrics', '/api/metrics']);

function normalizeRoute(route: string): string {
  const withoutQuery = route.split('?')[0] || '/';
  const normalized = withoutQuery
    .split('/')
    .map((segment) => {
      if (!segment) {
        return '';
      }
      if (segment.startsWith(':')) {
        return segment;
      }
      if (/^\d+$/.test(segment)) {
        return ':id';
      }
      if (/^[0-9a-fA-F-]{8,}$/.test(segment)) {
        return ':id';
      }
      if (segment.length > 32) {
        return ':id';
      }
      return segment;
    })
    .join('/');

  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

@Injectable()
export class PrometheusMetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: PrometheusMetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const rawPath = req.originalUrl.split('?')[0];
    if (METRICS_PATHS.has(rawPath)) {
      next();
      return;
    }

    const method = req.method.toUpperCase();
    const requestStartedAt = process.hrtime.bigint();
    const route = normalizeRoute(rawPath);

    this.metrics.incrementInFlight(method, route);

    res.on('finish', () => {
      const durationSeconds =
        Number(process.hrtime.bigint() - requestStartedAt) / 1e9;
      this.metrics.observeHttpRequest({
        method,
        route,
        status: String(res.statusCode),
        durationSeconds,
      });
      this.metrics.decrementInFlight(method, route);
    });

    next();
  }
}
