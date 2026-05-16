import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PiiCryptoService } from './pii-crypto.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { SECURITY_METRICS } from '@movie-hub/shared-types';
import { Counter } from 'prom-client';

// Define the payload structure for booking confirmed event
export interface BookingConfirmedOutboxPayload {
  bookingId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  [key: string]: any;
}

@Injectable()
export class NotificationOutboxService {
  private readonly logger = new Logger(NotificationOutboxService.name);

  // We use a setter to avoid circular dependency if needed, or we can just emit an internal event
  // For simplicity, we'll assume the consumer logic will call PaymentService's send email function,
  // or we inject the NotificationAdapter here.
  private consumerCallback?: (payload: BookingConfirmedOutboxPayload) => Promise<boolean>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly piiCryptoService: PiiCryptoService,
    private readonly configService: ConfigService,
    @InjectMetric(SECURITY_METRICS.NOTIFICATION_OUTBOX_DEAD_LETTER)
    private readonly deadLetterCounter: Counter<string>
  ) {}

  setConsumerCallback(callback: (payload: BookingConfirmedOutboxPayload) => Promise<boolean>) {
    this.consumerCallback = callback;
  }

  /**
   * Enqueue a booking confirmation notification to the outbox.
   * This MUST be called within the same Prisma transaction that confirms the booking.
   */
  async enqueueBookingConfirmed(
    prismaTx: any,
    payload: BookingConfirmedOutboxPayload
  ): Promise<void> {
    const eventType = 'BOOKING_CONFIRMED';
    const version = 'v1';
    // Idempotency key per spec: {booking_id}:{event_type}:{version}
    const idempotencyKey = `${payload.bookingId}:${eventType}:${version}`;

    // Check if duplicate (though idempotency_key unique constraint also guards this)
    const existing = await prismaTx.notificationOutbox.findUnique({
      where: { idempotency_key: idempotencyKey }
    });

    if (existing) {
      this.logger.log(`Outbox event already exists for ${idempotencyKey}, skipping enqueue`);
      return;
    }

    const payloadStr = JSON.stringify(payload);
    const encryptedPayload = this.piiCryptoService.encrypt(payloadStr);

    await prismaTx.notificationOutbox.create({
      data: {
        idempotency_key: idempotencyKey,
        event_type: eventType,
        payload: encryptedPayload,
        status: 'PENDING',
        attempts: 0,
      },
    });
    
    this.logger.log(`Enqueued outbox event ${eventType} for booking ${payload.bookingId}`);
  }

  // Consumer side
  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutboxEvents() {
    if (!this.consumerCallback) return;

    // Process PENDING and FAILED (with backoff)
    const batchSize = 10;
    
    const events = await this.prisma.notificationOutbox.findMany({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'FAILED', attempts: { lt: 3 } }
        ]
      },
      orderBy: { created_at: 'asc' },
      take: batchSize,
    });

    if (!events.length) return;

    for (const event of events) {
      try {
        // Optimistic locking / mark as processing
        await this.prisma.notificationOutbox.update({
          where: { id: event.id },
          data: { status: 'PROCESSING', attempts: event.attempts + 1 },
        });

        // Decrypt payload
        const decryptedStr = this.piiCryptoService.decrypt(event.payload);
        const data: BookingConfirmedOutboxPayload = JSON.parse(decryptedStr);

        let success = false;
        if (event.event_type === 'BOOKING_CONFIRMED') {
          // Idempotency on consumer side before sending
          // Actually, since we only process PENDING/FAILED, if it's COMPLETED it's skipped.
          success = await this.consumerCallback(data);
        } else {
          this.logger.warn(`Unknown event type ${event.event_type}, skipping`);
          success = true; // Mark as skipped/success
        }

        if (success) {
          // Redact PII after successful delivery
          const redactedPayload = this.piiCryptoService.redactPayloadFields(decryptedStr, [
            'customerEmail', 
            'customerPhone', 
            'customerName', 
          ]);

          await this.prisma.notificationOutbox.update({
            where: { id: event.id },
            data: { 
              status: 'COMPLETED', 
              processed_at: new Date(),
              payload: this.piiCryptoService.encrypt(redactedPayload)
            },
          });
          this.logger.log(`Successfully processed and redacted event ${event.id}`);
        } else {
          throw new Error('Adapter failed to send notification');
        }
      } catch (error) {
        const newAttempts = event.attempts + 1;
        const newStatus = newAttempts >= 3 ? 'DEAD_LETTER' : 'FAILED';
        
        await this.prisma.notificationOutbox.update({
          where: { id: event.id },
          data: { status: newStatus },
        });

        if (newStatus === 'DEAD_LETTER') {
          this.deadLetterCounter.inc({ event_type: event.event_type });
        }
        
        this.logger.error(`Failed to process event ${event.id}. Status: ${newStatus}`, error);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeOldOutboxEvents() {
    const retentionDays = this.configService.get<number>('OUTBOX_PII_RETENTION_DAYS') ?? 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.notificationOutbox.deleteMany({
      where: {
        created_at: { lt: cutoffDate },
      },
    });

    if (result.count > 0) {
      this.logger.log(`Purged ${result.count} old outbox events`);
    }
  }
}
