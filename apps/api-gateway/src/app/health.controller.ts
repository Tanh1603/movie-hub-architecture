import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Controller('health')
export class HealthController {
  private readonly startupTime = new Date();

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('secrets')
  checkSecretsAge(@Res() res: Response) {
    const now = new Date();
    
    // Example rotation deadlines (simulated tracking for Phase 08)
    const secrets = [
      { name: 'CLERK_SECRET_KEY', ageDays: 15, maxAgeDays: 90 },
      { name: 'VNPAY_HASH_SECRET', ageDays: 45, maxAgeDays: 90 },
      { name: 'ZALOPAY_KEY1', ageDays: 20, maxAgeDays: 90 },
      { name: 'JWT_SIGNING_KEY', ageDays: 10, maxAgeDays: 30 },
      { name: 'DB_CREDENTIALS', ageDays: 120, maxAgeDays: 180 },
    ];

    const warnings = secrets.filter(s => s.ageDays >= s.maxAgeDays * 0.8);
    const expired = secrets.filter(s => s.ageDays >= s.maxAgeDays);

    const status = expired.length > 0 ? HttpStatus.SERVICE_UNAVAILABLE 
                  : warnings.length > 0 ? HttpStatus.OK 
                  : HttpStatus.OK;

    return res.status(status).json({
      status: expired.length > 0 ? 'CRITICAL' : warnings.length > 0 ? 'WARNING' : 'OK',
      uptime_seconds: Math.floor((now.getTime() - this.startupTime.getTime()) / 1000),
      secrets: secrets.map(s => ({
        name: s.name,
        age_days: s.ageDays,
        max_age_days: s.maxAgeDays,
        status: s.ageDays >= s.maxAgeDays ? 'EXPIRED' : s.ageDays >= s.maxAgeDays * 0.8 ? 'NEEDS_ROTATION_SOON' : 'HEALTHY'
      }))
    });
  }
}

