import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisPubSubService } from '@movie-hub/shared-redis';
import { Request } from 'express';
import { createHash } from 'crypto';

@Injectable()
export class BruteForceProtectionService {
  private readonly logger = new Logger(BruteForceProtectionService.name);
  private readonly failureThreshold = 30;
  private readonly lockSeconds = 5 * 60;

  constructor(
    @Inject('REDIS_AUTH') private readonly redis: RedisPubSubService
  ) {}

  getLockDurationSeconds(): number {
    return this.lockSeconds;
  }

  async assertNotLocked(request: Request, accountKey: string): Promise<void> {
    const ip = this.getClientIp(request);
    const ipLockKey = this.lockKeyByIp(ip);
    const accountLockKey = this.lockKeyByAccount(accountKey);

    const [isIpLocked, isAccountLocked] = await Promise.all([
      this.redis.exists(ipLockKey),
      this.redis.exists(accountLockKey),
    ]);

    if (isIpLocked || isAccountLocked) {
      throw new Error('AUTH_TEMPORARILY_LOCKED');
    }
  }

  async recordFailure(
    request: Request,
    accountKey: string,
    correlationId: string
  ): Promise<void> {
    const ip = this.getClientIp(request);
    const ipFailureKey = this.failureKeyByIp(ip);
    const accountFailureKey = this.failureKeyByAccount(accountKey);

    const [ipFailures, accountFailures] = await Promise.all([
      this.incrementFailure(ipFailureKey),
      this.incrementFailure(accountFailureKey),
    ]);

    const shouldLock =
      ipFailures >= this.failureThreshold ||
      accountFailures >= this.failureThreshold;

    this.logger.warn(
      `Auth failure tracked ip=${this.fingerprint(ip)} account=${this.fingerprint(accountKey)} ipFailures=${ipFailures} accountFailures=${accountFailures} correlationId=${correlationId}`
    );

    if (!shouldLock) {
      return;
    }

    await Promise.all([
      this.redis.set(this.lockKeyByIp(ip), '1', this.lockSeconds),
      this.redis.set(this.lockKeyByAccount(accountKey), '1', this.lockSeconds),
    ]);

    this.logger.error(
      `Temporary auth lockout applied ip=${this.fingerprint(ip)} account=${this.fingerprint(accountKey)} correlationId=${correlationId}`
    );
  }

  async clearFailures(request: Request, accountKey: string): Promise<void> {
    const ip = this.getClientIp(request);
    await this.redis.del(
      this.failureKeyByIp(ip),
      this.failureKeyByAccount(accountKey)
    );
  }

  private async incrementFailure(key: string): Promise<number> {
    const pipeline = this.redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, this.lockSeconds);
    const result = await pipeline.exec();
    const value = result?.[0]?.[1];
    return typeof value === 'number' ? value : Number(value ?? 0);
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }

    return request.ip || 'unknown';
  }

  private failureKeyByIp(ip: string): string {
    return `auth:failed:ip:${ip}`;
  }

  private failureKeyByAccount(accountKey: string): string {
    return `auth:failed:account:${accountKey}`;
  }

  private lockKeyByIp(ip: string): string {
    return `auth:lock:ip:${ip}`;
  }

  private lockKeyByAccount(accountKey: string): string {
    return `auth:lock:account:${accountKey}`;
  }

  private fingerprint(value: string): string {
    return createHash('sha256').update(value).digest('hex').slice(0, 12);
  }
}
