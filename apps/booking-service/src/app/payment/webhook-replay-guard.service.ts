import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisPubSubService } from '@movie-hub/shared-redis';
import { PaymentMethod } from '@movie-hub/shared-types';

@Injectable()
export class WebhookReplayGuardService {
  private readonly logger = new Logger(WebhookReplayGuardService.name);
  private readonly dedupTtlSeconds = 24 * 60 * 60;
  private readonly auditTtlSeconds = 7 * 24 * 60 * 60;
  private readonly timestampToleranceMs: number;

  constructor(
    @Inject('REDIS_BOOKING') private readonly redis: RedisPubSubService,
    private readonly configService: ConfigService
  ) {
    this.timestampToleranceMs =
      this.configService.get<number>('WEBHOOK_TIMESTAMP_TOLERANCE_MS') ?? 300_000; // 5 minutes
  }

  /**
   * Reject callbacks with timestamps older than the configured tolerance window.
   * Returns `{ fresh: true }` if acceptable, `{ fresh: false }` if stale.
   *
   * When callbackTimestamp is undefined (provider doesn't supply it), we
   * accept the callback (cannot enforce what provider doesn't provide).
   */
  assertTimestampFresh(
    callbackTimestamp: number | undefined
  ): { fresh: boolean } {
    if (callbackTimestamp === undefined) {
      // Provider doesn't supply timestamp — cannot enforce freshness
      return { fresh: true };
    }

    const now = Date.now();
    const age = now - callbackTimestamp;

    // Accept callbacks slightly in the future (clock skew up to tolerance)
    if (age < -this.timestampToleranceMs) {
      return { fresh: false };
    }

    // Reject callbacks older than tolerance
    if (age > this.timestampToleranceMs) {
      return { fresh: false };
    }

    return { fresh: true };
  }

  async markIfFirstSeen(
    provider: PaymentMethod,
    dedupKey: string
  ): Promise<{ duplicate: boolean }> {
    const key = this.getDedupRedisKey(provider, dedupKey);
    const setResult = await this.redis.baseClient.set(
      key,
      '1',
      'EX',
      this.dedupTtlSeconds,
      'NX'
    );
    if (setResult === 'OK') {
      return { duplicate: false };
    }

    const replayCountKey = `${key}:replay_count`;
    const replayCount = await this.redis.baseClient.incr(replayCountKey);
    if (replayCount === 1) {
      await this.redis.baseClient.expire(replayCountKey, this.dedupTtlSeconds);
    }

    return { duplicate: true };
  }

  async auditSuspiciousCallback(
    provider: PaymentMethod,
    reason:
      | 'invalid_signature'
      | 'stale_callback'
      | 'duplicate'
      | 'missing_callback_identity',
    context: Record<string, unknown>
  ): Promise<void> {
    const record = {
      at: new Date().toISOString(),
      provider,
      reason,
      context,
    };
    this.logger.warn(
      `Suspicious payment callback provider=${provider} reason=${reason}`
    );

    const auditKey = `payment:webhook:audit:${Date.now()}:${Math.random()
      .toString(16)
      .slice(2, 10)}`;
    await this.redis.baseClient.set(
      auditKey,
      JSON.stringify(record),
      'EX',
      this.auditTtlSeconds
    );
  }

  private getDedupRedisKey(provider: PaymentMethod, dedupKey: string): string {
    return `payment:webhook:dedup:${provider}:${dedupKey}`;
  }
}
