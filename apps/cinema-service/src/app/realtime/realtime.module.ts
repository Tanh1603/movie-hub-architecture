import { Global, Module } from '@nestjs/common';
import { RedisModule } from '@movie-hub/shared-redis';
import { RealtimeService } from './realtime.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ResolveBookingService } from './resolve-booking.service';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      name: 'cinema',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        url: config.get('REDIS_URL'),
      }),
    }),
  ],
  providers: [RealtimeService, ResolveBookingService, PrismaService],
  exports: [RealtimeService, ResolveBookingService],
})
export class RealtimeModule {}
