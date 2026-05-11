import { Controller, Get, HttpStatus, Inject, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from './prisma.service';
import { RedisPubSubService } from '@movie-hub/shared-redis';
import {
  HealthLiveResponse,
  HealthReadyResponse,
  sanitizeHealthError,
} from '@movie-hub/shared-types';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    @Inject('REDIS_BOOKING') private readonly redis: RedisPubSubService
  ) {}

  @Get('live')
  live(): HealthLiveResponse {
    return { status: 'UP', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async ready(@Res() res: Response): Promise<void> {
    let dependencies: HealthReadyResponse['dependencies'] = [
      { name: 'postgres', status: 'DOWN' },
      { name: 'redis', status: 'DOWN' },
    ];
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('health timeout')), 500)
      );
      const results = (await Promise.race([
        Promise.allSettled([
          this.prisma.$queryRaw`SELECT 1`,
          this.redis.baseClient.ping(),
        ]),
        timeout,
      ])) as PromiseSettledResult<unknown>[];
      dependencies = results.map((result, index) => ({
        name: index === 0 ? 'postgres' : 'redis',
        status: result.status === 'fulfilled' ? 'UP' : 'DOWN',
      }));
      if (results.some((result) => result.status === 'rejected')) {
        throw (
          results.find(
            (result) => result.status === 'rejected'
          ) as PromiseRejectedResult
        ).reason;
      }
      res
        .status(HttpStatus.OK)
        .json({
          status: 'UP',
          timestamp: new Date().toISOString(),
          dependencies,
        } satisfies HealthReadyResponse);
    } catch (error) {
      res
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .json({
          status: 'DOWN',
          timestamp: new Date().toISOString(),
          dependencies,
          reason: sanitizeHealthError(error).message,
        });
    }
  }
}
