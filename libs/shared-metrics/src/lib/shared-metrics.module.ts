import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { PrometheusMetricsMiddleware } from './prometheus-metrics.middleware';
import { PrometheusMetricsService } from './prometheus-metrics.service';

@Module({
  controllers: [MetricsController],
  providers: [PrometheusMetricsService, PrometheusMetricsMiddleware],
  exports: [PrometheusMetricsService],
})
export class SharedMetricsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(PrometheusMetricsMiddleware).forRoutes('*');
  }
}
