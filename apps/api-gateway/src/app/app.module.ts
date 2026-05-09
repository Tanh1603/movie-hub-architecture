import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './module/user/user.module';
import { CinemaModule } from './module/cinema/cinema.module';
import Joi from 'joi';
import { MovieModule } from './module/movie/movie.module';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { RealtimeModule } from './module/realtime/realtime.module';
import { BookingModule } from './module/booking/booking.module';
import { DashboardModule } from './module/dashboard/dashboard.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
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
    BookingModule, // Includes: booking, payment, refund, concession, promotion, ticket, loyalty controllers
    RealtimeModule,
    DashboardModule, // BFF aggregation for admin dashboard
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
