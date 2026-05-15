import { Test, TestingModule } from '@nestjs/testing';
import { PiiCryptoService } from './pii-crypto.service';
import { ConfigService } from '@nestjs/config';

describe('PiiCryptoService', () => {
  let service: PiiCryptoService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PiiCryptoService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'NOTIFICATION_PII_SECRET') {
                return 'test-secret-that-is-long-enough-32bytes';
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PiiCryptoService>(PiiCryptoService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt string payload successfully', () => {
      const payload = JSON.stringify({
        bookingId: '123',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
      });

      const encrypted = service.encrypt(payload);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toEqual(payload);

      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toEqual(payload);
    });

    it('should throw error on malformed payload', () => {
      expect(() => service.decrypt('malformed_json_or_encrypted_data')).toThrow(
        'Decryption failed'
      );
    });
  });

  describe('redactPayloadFields', () => {
    it('should redact specified PII fields and keep other metadata intact', () => {
      const payloadObj = {
        bookingId: '123',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        totalPrice: 150000,
      };
      const payload = JSON.stringify(payloadObj);

      const redactedStr = service.redactPayloadFields(payload, [
        'customerName',
        'customerEmail',
      ]);
      const redacted = JSON.parse(redactedStr);

      expect(redacted.customerName).toBe('[REDACTED]');
      expect(redacted.customerEmail).toBe('[REDACTED]');
      expect(redacted.bookingId).toBe('123');
      expect(redacted.totalPrice).toBe(150000);
    });

    it('should handle missing fields gracefully', () => {
      const payloadObj = {
        bookingId: '123',
      };
      const payload = JSON.stringify(payloadObj);

      const redactedStr = service.redactPayloadFields(payload, ['customerName']);
      const redacted = JSON.parse(redactedStr);

      expect(redacted.customerName).toBeUndefined();
      expect(redacted.bookingId).toBe('123');
    });
  });
});
