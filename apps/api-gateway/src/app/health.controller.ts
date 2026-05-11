import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  HealthLiveResponse,
  HealthReadyResponse,
  sanitizeHealthError,
} from '@movie-hub/shared-types';

@Controller('health')
export class HealthController {
  @Get('live')
  liveness(): HealthLiveResponse {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  readiness(@Res() res: Response): void {
    try {
      const ready: HealthReadyResponse = {
        status: 'UP',
        timestamp: new Date().toISOString(),
        dependencies: [],
      };
      res.status(HttpStatus.OK).json(ready);
    } catch (error) {
      res
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .json(sanitizeHealthError(error));
    }
  }
}
