import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { BookingModule } from './booking/booking.module';
import { PaymentModule } from './payment/payment.module';
import { ConcessionModule } from './concession/concession.module';
import { PromotionModule } from './promotion/promotion.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { TicketModule } from './ticket/ticket.module';
import { RefundModule } from './refund/refund.module';
import { BookingRedisModule } from './redis/redis.module';
import { NotificationModule } from './notification/notification.module';
import Joi from 'joi';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { SecurityMetricsModule } from './security-metrics';

@Module({
  imports: [
    SecurityMetricsModule,
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/booking-service/.env',
      validationSchema: Joi.object({
        TCP_HOST: Joi.string().required(),
        TCP_PORT: Joi.number().required(),
        DATABASE_URL: Joi.string().required(),
        CINEMA_HOST: Joi.string().default('localhost'),
        CINEMA_PORT: Joi.number().default(3003),
        NODE_ENV: Joi.string().valid('development', 'production').default('development'),
        LOG_LEVEL: Joi.string().default('debug'),
        // Email configuration (optional)
        EMAIL_ENABLED: Joi.string().default('false'),
        EMAIL_HOST: Joi.string().default('smtp.gmail.com'),
        EMAIL_PORT: Joi.number().default(587),
        EMAIL_SECURE: Joi.string().default('false'),
        EMAIL_USER: Joi.string().optional(),
        EMAIL_PASSWORD: Joi.string().optional(),
        EMAIL_FROM: Joi.string().default('MovieHub <noreply@moviehub.com>'),
        VNPAY_TMN_CODE: Joi.string().optional(),
        VNPAY_HASH_SECRET: Joi.string().optional(),
        VNPAY_URL: Joi.string().uri().optional(),
        VNPAY_RETURN_URL: Joi.string().uri().optional(),
        ZALOPAY_APP_ID: Joi.string().optional(),
        ZALOPAY_KEY1: Joi.string().optional(),
        ZALOPAY_KEY2: Joi.string().optional(),
        ZALOPAY_CREATE_ORDER_URL: Joi.string().uri().optional(),
        ZALOPAY_CALLBACK_URL: Joi.string().uri().optional(),
        ZALOPAY_RETURN_URL: Joi.string().uri().optional(),
        ZALOPAY_QUERY_ORDER_URL: Joi.string().uri().optional(),
        PAYMENT_RECON_ENABLED: Joi.string().optional(),
        PAYMENT_RECON_INTERVAL_SECONDS: Joi.number().optional(),
        PAYMENT_RECON_STALE_MINUTES: Joi.number().optional(),
        PAYMENT_RECON_CRON: Joi.string().optional(),
        PAYMENT_RECON_LOCK_TTL_SECONDS: Joi.number().optional(),
        WEBHOOK_TIMESTAMP_TOLERANCE_MS: Joi.number().default(300_000),
        NOTIFICATION_PII_SECRET: Joi.string().optional(), // Must be 32 bytes hex for production
        OUTBOX_PII_RETENTION_DAYS: Joi.number().default(30),
      }),
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    BookingRedisModule,
    NotificationModule,
    BookingModule,
    PaymentModule,
    ConcessionModule,
    PromotionModule,
    LoyaltyModule,
    TicketModule,
    RefundModule,
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    PrismaService
  ],
})
export class AppModule {}
