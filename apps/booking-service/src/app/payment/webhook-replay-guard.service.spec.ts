import { WebhookReplayGuardService } from './webhook-replay-guard.service';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '@movie-hub/shared-types';

describe('WebhookReplayGuardService', () => {
  let service: WebhookReplayGuardService;
  let redis: any;
  let configService: Partial<ConfigService>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-15T10:00:00.000Z'));

    redis = {
      baseClient: {
        set: jest.fn().mockResolvedValue('OK'),
        incr: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
      },
    };

    configService = {
      get: jest.fn().mockReturnValue(300_000), // 5 min tolerance
    };

    service = new WebhookReplayGuardService(
      redis,
      configService as ConfigService
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('assertTimestampFresh', () => {
    it('should accept callback within tolerance window', () => {
      // 2 minutes old
      const callbackTs = Date.now() - 2 * 60 * 1000;
      const result = service.assertTimestampFresh(callbackTs);
      expect(result.fresh).toBe(true);
    });

    it('should accept callback at exact tolerance boundary', () => {
      // Exactly 5 minutes old
      const callbackTs = Date.now() - 300_000;
      const result = service.assertTimestampFresh(callbackTs);
      expect(result.fresh).toBe(true);
    });

    it('should reject callback older than tolerance', () => {
      // 6 minutes old
      const callbackTs = Date.now() - 6 * 60 * 1000;
      const result = service.assertTimestampFresh(callbackTs);
      expect(result.fresh).toBe(false);
    });

    it('should accept callback with undefined timestamp (provider does not supply)', () => {
      const result = service.assertTimestampFresh(undefined);
      expect(result.fresh).toBe(true);
    });

    it('should accept callback slightly in the future (clock skew)', () => {
      // 1 minute in the future
      const callbackTs = Date.now() + 60_000;
      const result = service.assertTimestampFresh(callbackTs);
      expect(result.fresh).toBe(true);
    });

    it('should reject callback far in the future (clock manipulation)', () => {
      // 10 minutes in the future
      const callbackTs = Date.now() + 10 * 60 * 1000;
      const result = service.assertTimestampFresh(callbackTs);
      expect(result.fresh).toBe(false);
    });
  });

  describe('markIfFirstSeen', () => {
    it('should mark first seen callback as non-duplicate', async () => {
      const result = await service.markIfFirstSeen(PaymentMethod.VNPAY, 'txn_123');
      expect(result.duplicate).toBe(false);
      expect(redis.baseClient.set).toHaveBeenCalledWith(
        expect.stringContaining('payment:webhook:dedup:VNPAY:txn_123'),
        '1',
        'EX',
        86400,
        'NX'
      );
    });

    it('should detect duplicate callback', async () => {
      redis.baseClient.set.mockResolvedValue(null);
      const result = await service.markIfFirstSeen(PaymentMethod.VNPAY, 'txn_123');
      expect(result.duplicate).toBe(true);
    });
  });

  describe('auditSuspiciousCallback', () => {
    it('should store stale_callback audit entry', async () => {
      await service.auditSuspiciousCallback(
        PaymentMethod.VNPAY,
        'stale_callback',
        { callbackTimestamp: 1000, serverTime: 2000, ageMs: 1000 }
      );
      expect(redis.baseClient.set).toHaveBeenCalledWith(
        expect.stringContaining('payment:webhook:audit:'),
        expect.stringContaining('"stale_callback"'),
        'EX',
        604800
      );
    });
  });
});
