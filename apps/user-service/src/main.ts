import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = await app.get(ConfigService);
  const httpPort = config.get<number>('HTTP_PORT') || 3006;

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: config.get<number>('TCP_PORT'),
    },
  });

  await app.startAllMicroservices();
  await app.listen(httpPort);

  Logger.log(`🚀 User service run successfully`);
}

bootstrap();
