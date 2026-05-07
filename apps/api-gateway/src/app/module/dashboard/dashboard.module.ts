import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { SERVICE_NAME } from '@movie-hub/shared-types';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AuthModule } from '../../common/auth/auth.module';

/**
 * DashboardModule
 *
 * BFF (Backend-for-Frontend) module for Admin Dashboard aggregation.
 * Connects to BOOKING, CINEMA, and MOVIE microservices to aggregate
 * data for dashboard KPIs, charts, and reports.
 */
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: SERVICE_NAME.BOOKING,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('BOOKING_HOST') || 'localhost',
            port: configService.get<number>('BOOKING_PORT') || 3004,
          },
        }),
      },
      {
        name: SERVICE_NAME.CINEMA,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('CINEMA_HOST') || 'localhost',
            port: configService.get<number>('CINEMA_PORT') || 3002,
          },
        }),
      },
      {
        name: SERVICE_NAME.Movie,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('MOVIE_HOST') || 'localhost',
            port: configService.get<number>('MOVIE_PORT') || 3003,
          },
        }),
      },
    ]),
    AuthModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
