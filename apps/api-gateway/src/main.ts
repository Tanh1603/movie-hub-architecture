import { LoggingInterceptor } from '@movie-hub/shared-types/common/logging.interceptor';
/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { AppModule } from './app/app.module';
import { TransformInterceptor } from './app/common/interceptor/transform.interceptor';
import { GlobalExceptionFilter } from './app/exception/global-exception.filter';
import { RedisIoAdapter } from './app/module/realtime/adapter/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['/socket.io/(.*)'],
  });

  app.use(cookieParser());
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
  });
  app.enableCors({ origin: true, credentials: true });

  const openapi = yaml.load(
    readFileSync('apps/api-gateway/doc/openapi.yml', 'utf8')
  ) as OpenAPIObject;

  SwaggerModule.setup('docs', app, openapi, {
    useGlobalPrefix: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor('Api-Gateway')
  );

  // Create Redis Adapter
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
