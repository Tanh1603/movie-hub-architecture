import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
      return true;
    }
    return false;
  }

  protected async getTracker(
    req: Record<string, any>
  ): Promise<string> {
    const userId = req?.userId;
    if (typeof userId === 'string' && userId.length > 0) {
      return `user:${userId}`;
    }

    const staffId = req?.staffContext?.staffId;
    if (typeof staffId === 'string' && staffId.length > 0) {
      return `staff:${staffId}`;
    }


    // Fallback to Express's req.ip (which parses X-Forwarded-For securely if trust proxy is enabled)
    return `ip:${req?.ip ?? 'unknown'}`;
  }
}
