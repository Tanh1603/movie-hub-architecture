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
  app.enableShutdownHooks();

  const serviceName = 'cinema-service';
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
