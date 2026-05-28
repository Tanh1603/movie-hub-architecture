import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from 'nestjs-pino';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.enableShutdownHooks();

  const serviceName = 'movie-service';
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

  app.get(Logger).log(`🚀 Movie service run successfully`);
}

bootstrap();
