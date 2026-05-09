import { verifyToken } from '@clerk/backend';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisPubSubService } from '@movie-hub/shared-redis';
import { createHash } from 'crypto';

type VerifiedToken = {
  sub: string;
  iss?: string;
  aud?: string | string[];
  azp?: string;
  exp?: number;
  [key: string]: unknown;
};

@Injectable()
export class TokenValidationService {
  private readonly logger = new Logger(TokenValidationService.name);
  private readonly jwtKeyCacheTtlSeconds = 60 * 60;

  constructor(
    private readonly configService: ConfigService,
    @Inject('REDIS_AUTH') private readonly redis: RedisPubSubService
  ) {}

  async validateTokenOrThrow(token: string): Promise<VerifiedToken> {
    const startTime = Date.now();
    const jwtKey = await this.getCachedJwtKey();
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
    const audience = this.getCsvList('CLERK_AUDIENCE');
    const authorizedParties = this.getCsvList('CLERK_AUTHORIZED_PARTIES');

    const payload = (await verifyToken(token, {
      secretKey,
      jwtKey: jwtKey ?? undefined,
      audience: audience.length > 0 ? audience : undefined,
      authorizedParties:
        authorizedParties.length > 0 ? authorizedParties : undefined,
    })) as VerifiedToken;

    this.assertIssuer(payload.iss);
    this.assertSubject(payload.sub);

    const elapsedMs = Date.now() - startTime;
    if (elapsedMs > 50) {
      this.logger.warn(`Token verification latency ${elapsedMs}ms exceeded target`);
    } else {
      this.logger.debug(`Token verification latency ${elapsedMs}ms`);
    }

    return payload;
  }

  extractAccountKey(token: string): string {
    try {
      const payload = this.decodeJwtPayload(token);
      if (typeof payload?.sub === 'string' && payload.sub.length > 0) {
        return payload.sub;
      }
    } catch {
      // Ignore decode errors and fallback to token fingerprint.
    }

    return `token:${this.sha256(token).slice(0, 24)}`;
  }

  private async getCachedJwtKey(): Promise<string | null> {
    const cacheKey = 'auth:clerk:jwt:key';
    const cached = await this.redis.get<string>(cacheKey);
    if (cached) {
      return cached;
    }

    const jwtKey = this.configService.get<string>('CLERK_JWT_KEY');
    if (!jwtKey) {
      return null;
    }

    await this.redis.set(cacheKey, jwtKey, this.jwtKeyCacheTtlSeconds);
    return jwtKey;
  }

  private   getCsvList(key: string): string[] {
    const value = this.configService.get<string>(key);
    if (!value) {
      return [];
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private assertSubject(sub: unknown): asserts sub is string {
    if (typeof sub !== 'string' || sub.length === 0) {
      throw new Error('Invalid token subject');
    }
  }

  private assertIssuer(issuer: unknown): void {
    if (typeof issuer !== 'string' || issuer.length === 0) {
      throw new Error('Missing token issuer');
    }

    const expectedIssuer = this.configService.get<string>('CLERK_ISSUER');
    if (expectedIssuer) {
      if (issuer !== expectedIssuer) {
        throw new Error('Token issuer mismatch');
      }
      return;
    }

    // Enforce Clerk-issued tokens even when CLERK_ISSUER is not explicitly configured.
    if (!issuer.startsWith('https://') || !issuer.includes('clerk.')) {
      throw new Error('Token issuer is not a Clerk issuer');
    }
  }

  private decodeJwtPayload(token: string): Record<string, unknown> {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return {};
    }

    const payloadSegment = tokenParts[1];
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '='
    );
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}

