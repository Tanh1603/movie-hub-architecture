import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule, Params } from 'nestjs-pino';
import { ClsModule, ClsService } from 'nestjs-cls';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { RpcContextInterceptor } from './rpc-context.interceptor';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req) => {
          cls.set('correlationId', req.headers['x-correlation-id'] || randomUUID());
          cls.set('requestId', req.headers['x-request-id'] || randomUUID());
          cls.set('userId', req.user?.id || req.headers['x-user-id']);
        },
      },
    }),
    PinoLoggerModule.forRootAsync({
      inject: [ClsService],
      useFactory: (cls: ClsService): Params => {
        const isProduction = process.env['NODE_ENV'] === 'production';
        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'debug',
            formatters: {
              level: (label: any) => {
                return { level: label };
              },
            },
            redact: {
              paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password'],
              censor: '[REDACTED]',
            },
            mixin: () => ({
              correlationId: cls.get('correlationId'),
              requestId: cls.get('requestId'),
              userId: cls.get('userId'),
            }),
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: { singleLine: true, colorize: true },
                },
          } as any,
        };
      },
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RpcContextInterceptor,
    },
  ],
})
export class CoreObservabilityModule {}
