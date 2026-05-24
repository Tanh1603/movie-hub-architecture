/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from 'nestjs-pino';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './filter/all-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.enableShutdownHooks();

  const serviceName = 'booking-service';
  let shutdownStarted = false;

  const shutdown = async (signal: NodeJS.Signals) => {
    if (shutdownStarted) {
      return;
    }

    shutdownStarted = true;
    logger.log(
      JSON.stringify({
        event: 'shutdown-start',
        service: serviceName,
        signal,
        timestamp: new Date().toISOString(),
      })
    );

    const timeout = setTimeout(() => {
      logger.error(
        JSON.stringify({
          event: 'shutdown-timeout',
          service: serviceName,
          signal,
          timestamp: new Date().toISOString(),
          timeoutMs: 30000,
        })
      );
      process.exit(1);
    }, 30000);
    timeout.unref();

    try {
      await app.close();
      clearTimeout(timeout);
      logger.log(
        JSON.stringify({
          event: 'shutdown-complete',
          service: serviceName,
          signal,
          timestamp: new Date().toISOString(),
        })
      );
      process.exit(0);
    } catch (error) {
      clearTimeout(timeout);
      logger.error(
        JSON.stringify({
          event: 'shutdown-failed',
          service: serviceName,
          signal,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.stack : String(error)
        })
      );
      process.exit(1);
    }
  };

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  const config = app.get(ConfigService);
  const httpPort = config.get<number>('HTTP_PORT') || 3005;

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: config.get<number>('TCP_PORT'),
    },
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.startAllMicroservices();
  await app.listen(httpPort);

  app.get(Logger).log(`🚀 Booking service run successfully`);
}

bootstrap();
