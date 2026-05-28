import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { SERVICE_NAME } from '@movie-hub/shared-types';
import { ClerkAuthGuard } from '../guard/clerk-auth.guard';
import { OptionalClerkAuthGuard } from '../guard/optional-clerk-auth.guard';
import { RoleGuard } from '../guard/role.guard';
import { RedisModule } from '@movie-hub/shared-redis';
import { SharedMetricsModule } from '@movie-hub/shared-metrics';
import { TokenValidationService } from './token-validation.service';
import { BruteForceProtectionService } from './brute-force-protection.service';
import { securityMetricProviders } from '../security-metrics';

@Module({
  imports: [
    SharedMetricsModule,
    RedisModule.forRootAsync({
      name: 'auth',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        url:
          configService.get<string>('REDIS_URL') ||
          `redis://${configService.get<string>('REDIS_HOST') || 'localhost'}:${configService.get<number>('REDIS_PORT') || 6379}`,
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: SERVICE_NAME.USER,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('USER_HOST') || 'localhost',
            port: configService.get<number>('USER_PORT') || 3001,
          },
        }),
      },
    ]),
  ],
  providers: [
    ...securityMetricProviders,
    ClerkAuthGuard,
    OptionalClerkAuthGuard,
    RoleGuard,
    TokenValidationService,
    BruteForceProtectionService,
  ],
  exports: [
    ...securityMetricProviders,
    ClientsModule,
    ClerkAuthGuard,
    OptionalClerkAuthGuard,
    RoleGuard,
    TokenValidationService,
    BruteForceProtectionService,
  ],
})
export class AuthModule {}
