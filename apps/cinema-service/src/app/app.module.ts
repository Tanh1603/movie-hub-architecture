import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CinemaModule } from './cinema/cinema.module';
import { ShowtimeModule } from './showtime/showtime.module';
import { CinemaLocationModule } from './cinema-location/cinema-location.module';
import { RealtimeModule } from './realtime/realtime.module';
import { HallModule } from './hall/hall.module';
import { TicketPricingModule } from './ticket-pricing/ticket-pricing.module';
import { HealthController } from './health.controller';
import Joi from 'joi';
import { SharedMetricsModule } from '@movie-hub/shared-metrics';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/cinema-service/.env',
      validationSchema: Joi.object({
        TCP_HOST: Joi.string().required(),
        TCP_PORT: Joi.string().required(),
        HTTP_PORT: Joi.number().optional(),
      }),
    }),
    CinemaModule,
    ShowtimeModule,
    CinemaLocationModule,
    RealtimeModule,
    HallModule,
    TicketPricingModule,
    SharedMetricsModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
