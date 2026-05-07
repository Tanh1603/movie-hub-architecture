import { Module } from '@nestjs/common';
import { CinemaController } from './controller/cinema.controller';
import { CinemaService } from './service/cinema.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { SERVICE_NAME } from '@movie-hub/shared-types';
import { ShowtimeController } from './controller/showtime.controller';
import { ShowtimeService } from './service/showtime.service';
import { HallController } from './controller/hall.controller';
import { HallService } from './service/hall.service';
import { TicketPricingController } from './controller/ticket-pricing.controller';
import { TicketPricingService } from './service/ticket-pricing.service';

import { AuthModule } from '../../common/auth/auth.module';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: SERVICE_NAME.CINEMA,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('CINEMA_HOST'),
            port: configService.get<number>('CINEMA_PORT'),
          },
        }),
      },
    ]),
    AuthModule,
  ],
  controllers: [
    CinemaController,
    ShowtimeController,
    HallController,
    TicketPricingController,
  ],
  providers: [
    CinemaService,
    ShowtimeService,
    HallService,
    TicketPricingService,
  ],
})
export class CinemaModule {}
