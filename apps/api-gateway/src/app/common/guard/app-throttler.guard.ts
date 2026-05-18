import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') {
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

    const forwardedFor = req?.headers?.['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      return `ip:${forwardedFor.split(',')[0].trim()}`;
    }

    return `ip:${req?.ip ?? 'unknown'}`;
  }
}
