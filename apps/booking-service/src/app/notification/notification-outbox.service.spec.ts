import { Test, TestingModule } from '@nestjs/testing';
import { NotificationOutboxService } from './notification-outbox.service';
import { PrismaService } from '../prisma.service';
import { PiiCryptoService } from './pii-crypto.service';
import { ConfigService } from '@nestjs/config';

describe('NotificationOutboxService', () => {
  let service: NotificationOutboxService;
  let prisma: any;
  let piiCryptoService: any;
  let configService: any;

  beforeEach(async () => {
    prisma = {
      notificationOutbox: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    piiCryptoService = {
      encrypt: jest.fn((str) => `encrypted_${str}`),
      decrypt: jest.fn((str) => str.replace('encrypted_', '')),
      redactPayloadFields: jest.fn((str) => str.replace('customerName', 'REDACTED')),
    };

    configService = {
      get: jest.fn().mockReturnValue(30),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationOutboxService,
        { provide: PrismaService, useValue: prisma },
        { provide: PiiCryptoService, useValue: piiCryptoService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<NotificationOutboxService>(NotificationOutboxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enqueueBookingConfirmed', () => {
    it('should enqueue event successfully if not duplicate', async () => {
      prisma.notificationOutbox.findUnique.mockResolvedValue(null);
      const payload = {
        bookingId: 'b1',
        customerName: 'John',
        customerEmail: 'j@example.com',
      };
      
      const tx = prisma;
      await service.enqueueBookingConfirmed(tx, payload);

      expect(tx.notificationOutbox.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            idempotency_key: 'b1:BOOKING_CONFIRMED:v1',
            status: 'PENDING',
          }),
        })
      );
      expect(piiCryptoService.encrypt).toHaveBeenCalled();
    });

    it('should skip enqueue if event already exists (duplicate idempotency key)', async () => {
      prisma.notificationOutbox.findUnique.mockResolvedValue({ id: 1 });
      const payload = {
        bookingId: 'b1',
        customerName: 'John',
        customerEmail: 'j@example.com',
      };
      
      const tx = prisma;
      await service.enqueueBookingConfirmed(tx, payload);

      expect(tx.notificationOutbox.create).not.toHaveBeenCalled();
    });
  });

  describe('processOutboxEvents', () => {
    let mockConsumerCallback: jest.Mock;

    beforeEach(() => {
      mockConsumerCallback = jest.fn();
      service.setConsumerCallback(mockConsumerCallback);
    });

    it('should process pending event and mark as COMPLETED', async () => {
      const encryptedPayload = `encrypted_${JSON.stringify({ bookingId: 'b1' })}`;
      prisma.notificationOutbox.findMany.mockResolvedValue([
        {
          id: 1,
          status: 'PENDING',
          attempts: 0,
          event_type: 'BOOKING_CONFIRMED',
          payload: encryptedPayload,
        },
      ]);
      mockConsumerCallback.mockResolvedValue(true);

      await service.processOutboxEvents();

      expect(prisma.notificationOutbox.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ status: 'PROCESSING', attempts: 1 }),
        })
      );

      expect(mockConsumerCallback).toHaveBeenCalledWith({ bookingId: 'b1' });

      expect(prisma.notificationOutbox.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ status: 'COMPLETED' }),
        })
      );
    });

    it('should transition to DEAD_LETTER after 3 failed attempts', async () => {
      const encryptedPayload = `encrypted_${JSON.stringify({ bookingId: 'b1' })}`;
      prisma.notificationOutbox.findMany.mockResolvedValue([
        {
          id: 1,
          status: 'FAILED',
          attempts: 2, // 3rd attempt
          event_type: 'BOOKING_CONFIRMED',
          payload: encryptedPayload,
        },
      ]);
      mockConsumerCallback.mockResolvedValue(false); // Simulate failure

      await service.processOutboxEvents();

      expect(prisma.notificationOutbox.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ status: 'DEAD_LETTER' }),
        })
      );
    });
  });

  describe('purgeOldOutboxEvents', () => {
    it('should delete events older than retention TTL', async () => {
      prisma.notificationOutbox.deleteMany.mockResolvedValue({ count: 5 });

      await service.purgeOldOutboxEvents();

      expect(prisma.notificationOutbox.deleteMany).toHaveBeenCalled();
    });
  });
});
