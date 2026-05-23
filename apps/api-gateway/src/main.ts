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
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.enableShutdownHooks();
  const serviceName = 'api-gateway';
  let shutdownStarted = false;

  const shutdown = async (signal: NodeJS.Signals) => {
    if (shutdownStarted) {
      return;
    }

    shutdownStarted = true;
    Logger.log(
      JSON.stringify({
        event: 'shutdown-start',
        service: serviceName,
        signal,
        timestamp: new Date().toISOString(),
      }),
      serviceName
    );

    const timeout = setTimeout(() => {
      Logger.error(
        JSON.stringify({
          event: 'shutdown-timeout',
          service: serviceName,
          signal,
          timestamp: new Date().toISOString(),
          timeoutMs: 30000,
        }),
        undefined,
        serviceName
      );
      process.exit(1);
    }, 30000);
    timeout.unref();

    try {
      await app.close();
      clearTimeout(timeout);
      Logger.log(
        JSON.stringify({
          event: 'shutdown-complete',
          service: serviceName,
          signal,
          timestamp: new Date().toISOString(),
        }),
        serviceName
      );
      process.exit(0);
    } catch (error) {
      clearTimeout(timeout);
      Logger.error(
        JSON.stringify({
          event: 'shutdown-failed',
          service: serviceName,
          signal,
          timestamp: new Date().toISOString(),
        }),
        error instanceof Error ? error.stack : String(error),
        serviceName
      );
      process.exit(1);
    }
  };

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['/socket.io/(.*)', 'metrics'],
  });

  app.use(cookieParser());
  
  // Enforce TLS policy (HSTS)
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

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
