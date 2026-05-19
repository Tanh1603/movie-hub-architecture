import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './module/user/user.module';
import { CinemaModule } from './module/cinema/cinema.module';
import Joi from 'joi';
import { MovieModule } from './module/movie/movie.module';
import { APP_PIPE } from '@nestjs/core';
import { APP_GUARD } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { RealtimeModule } from './module/realtime/realtime.module';
import { BookingModule } from './module/booking/booking.module';
import { DashboardModule } from './module/dashboard/dashboard.module';
import { HealthController } from './health.controller';
import { SharedMetricsModule } from '@movie-hub/shared-metrics';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppThrottlerGuard } from './common/guard/app-throttler.guard';

import { PrometheusModule } from '@willsoto/nestjs-prometheus';

import { securityMetricProviders } from './common/security-metrics';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/api-gateway/.env',
      validationSchema: Joi.object({
        CLERK_SECRET_KEY: Joi.string().required(),
        USER_HOST: Joi.string().required(),
        USER_PORT: Joi.number().required(),
        MOVIE_HOST: Joi.string().required(),
        MOVIE_PORT: Joi.number().required(),
        CINEMA_HOST: Joi.string().required(),
        CINEMA_PORT: Joi.number().required(),
        BOOKING_HOST: Joi.string().required(),
        BOOKING_PORT: Joi.number().required(),
        REDIS_URL: Joi.string().optional(),
        REDIS_HOST: Joi.string().optional(),
        REDIS_PORT: Joi.number().optional(),
        CLERK_JWT_KEY: Joi.string().optional(),
        CLERK_ISSUER: Joi.string().optional(),
        CLERK_AUDIENCE: Joi.string().optional(),
        CLERK_AUTHORIZED_PARTIES: Joi.string().optional(),
        CLERK_WEBHOOK_SECRET: Joi.string().optional(),
      }),
    }),
    UserModule,
    MovieModule,
    CinemaModule,
    BookingModule,
    RealtimeModule,
    DashboardModule, // BFF aggregation for admin dashboard
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
      {
        name: 'sensitiveBurst',
        ttl: 10_000,
        limit: 30,
        blockDuration: 30_000,
      },
      {
        name: 'sensitiveSustained',
        ttl: 60_000,
        limit: 80,
        blockDuration: 120_000,
      },
    ]),
    SharedMetricsModule,
  ],
  controllers: [HealthController],
  providers: [
    ...securityMetricProviders,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
