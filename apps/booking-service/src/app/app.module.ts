import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
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
import { OutboxModule } from './outbox/outbox.module';
import { HealthController } from './health.controller';
import Joi from 'joi';
import { SharedMetricsModule } from '@movie-hub/shared-metrics';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/booking-service/.env',
      validationSchema: Joi.object({
        TCP_HOST: Joi.string().required(),
        TCP_PORT: Joi.number().required(),
        HTTP_PORT: Joi.number().optional(),
        DATABASE_URL: Joi.string().required(),
        CINEMA_HOST: Joi.string().default('localhost'),
        CINEMA_PORT: Joi.number().default(3003),
        NODE_ENV: Joi.string()
          .valid('development', 'production')
          .default('development'),
        LOG_LEVEL: Joi.string().default('debug'),
        // Email configuration (optional)
        EMAIL_ENABLED: Joi.string().default('false'),
        EMAIL_HOST: Joi.string().default('smtp.gmail.com'),
        EMAIL_PORT: Joi.number().default(587),
        EMAIL_SECURE: Joi.string().default('false'),
        EMAIL_USER: Joi.string().optional(),
        EMAIL_PASSWORD: Joi.string().optional(),
        EMAIL_FROM: Joi.string().default('MovieHub <noreply@moviehub.com>'),
      }),
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    BookingRedisModule,
    NotificationModule,
    OutboxModule,
    BookingModule,
    PaymentModule,
    ConcessionModule,
    PromotionModule,
    LoyaltyModule,
    TicketModule,
    RefundModule,
    SharedMetricsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
