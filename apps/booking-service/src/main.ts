/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { LoggingInterceptor } from '@movie-hub/shared-types/common/logging.interceptor';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './filter/all-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const config = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: config.get<number>('TCP_PORT'),
    },
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor('Booking-Service'));

  await app.startAllMicroservices();

  Logger.log(`🚀 Booking service run successfully`);
}

bootstrap();
