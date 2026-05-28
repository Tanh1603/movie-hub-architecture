import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class PiiCryptoService {
  private readonly logger = new Logger(PiiCryptoService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    const secretStr = this.configService.get<string>('NOTIFICATION_PII_SECRET');
    if (secretStr) {
      if (secretStr.length === 64) {
        this.key = Buffer.from(secretStr, 'hex');
      } else {
        this.key = crypto.scryptSync(secretStr, 'salt', 32);
      }
    } else {
      this.logger.warn(
        'NOTIFICATION_PII_SECRET not set, using default key for development ONLY.'
      );
      this.key = crypto.scryptSync('default-dev-secret', 'salt', 32);
    }
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag().toString('base64');

    return JSON.stringify({
      iv: iv.toString('base64'),
      encrypted,
      authTag,
    });
  }

  decrypt(encryptedData: string): string {
    try {
      const { iv, encrypted, authTag } = JSON.parse(encryptedData);

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(iv, 'base64')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'base64'));

      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt PII payload', error);
      throw new Error('Decryption failed');
    }
  }

  redactPayloadFields(payloadStr: string, fieldsToRedact: string[]): string {
    try {
      const payload = JSON.parse(payloadStr);
      for (const field of fieldsToRedact) {
        if (payload[field] !== undefined) {
          payload[field] = '[REDACTED]';
        }
        // Also handle nested structures if necessary (e.g. payload.booking.customerEmail)
        if (payload.booking && payload.booking[field] !== undefined) {
          payload.booking[field] = '[REDACTED]';
        }
      }
      return JSON.stringify(payload);
    } catch {
      return payloadStr; // If it's not JSON, return as is (shouldn't happen)
    }
  }
}
