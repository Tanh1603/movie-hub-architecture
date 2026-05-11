import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = await app.get(ConfigService);
  const httpPort = config.get<number>('HTTP_PORT') || 3007;

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: config.get<number>('TCP_PORT'),
    },
  });

  await app.startAllMicroservices();
  await app.listen(httpPort);

  Logger.log(`🚀 Movie service run successfully`);
}

bootstrap();
