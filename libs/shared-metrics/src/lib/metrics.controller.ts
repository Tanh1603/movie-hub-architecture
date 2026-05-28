import { Controller, Get, Header, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrometheusMetricsService } from './prometheus-metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: PrometheusMetricsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async metricsText(
    @Res({ passthrough: true }) res: Response
  ): Promise<string> {
    res.setHeader('Content-Type', this.metrics.contentType);
    return this.metrics.metrics();
  }
}
