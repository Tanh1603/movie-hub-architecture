/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './filter/all-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const httpPort = config.get<number>('HTTP_PORT') || 3008;

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: config.get<number>('TCP_PORT'),
    },
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.startAllMicroservices();
  await app.init();
  await app.listen(httpPort);

  Logger.log(`🚀 Cinema service run successfully`);
}

bootstrap();
