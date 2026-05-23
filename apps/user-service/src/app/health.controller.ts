import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from './prisma.service';
import {
  HealthLiveResponse,
  HealthReadyResponse,
  sanitizeHealthError,
} from '@movie-hub/shared-types';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('live')
  live(): HealthLiveResponse {
    return { status: 'UP', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async ready(@Res() res: Response): Promise<void> {
    let dependencies: HealthReadyResponse['dependencies'] = [
      { name: 'postgres', status: 'DOWN' },
    ];
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('health timeout')), 500)
      );
      const result = await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        timeout,
      ]);
      dependencies = [{ name: 'postgres', status: 'UP' }];
      res.status(HttpStatus.OK).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        dependencies,
      } satisfies HealthReadyResponse);
    } catch (error) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        dependencies,
        reason: sanitizeHealthError(error).message,
      });
    }
  }
}
