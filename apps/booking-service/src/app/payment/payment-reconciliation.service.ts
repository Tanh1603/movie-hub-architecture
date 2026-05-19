import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { BookingStatus, PaymentMethod, PaymentStatus } from '@movie-hub/shared-types';
import { TicketStatus } from '@movie-hub/shared-types';
import { PAYMENT_ADAPTERS } from './payment.constants';
import { PaymentAdapter } from './adapters/payment-adapter.interface';
import { PaymentTransitionPolicyService } from './payment-transition-policy.service';
import { Cron } from '@nestjs/schedule';
import { RedisPubSubService } from '@movie-hub/shared-redis';

@Injectable()
export class PaymentReconciliationService {
  private readonly logger = new Logger(PaymentReconciliationService.name);
  private readonly lockKey = 'payment:recon:lock';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly transitionPolicy: PaymentTransitionPolicyService,
    @Inject(PAYMENT_ADAPTERS) private readonly adapters: PaymentAdapter[],
    @Inject('REDIS_BOOKING') private readonly redis: RedisPubSubService
  ) {}

  @Cron(process.env.PAYMENT_RECON_CRON ?? '0 * * * * *')
  async runScheduled(): Promise<void> {
    const enabled = this.configService.get<string>('PAYMENT_RECON_ENABLED') !== 'false';
    if (!enabled) {
      return;
    }

    const lockToken = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    const lockTtlSec = Number(
      this.configService.get<string>('PAYMENT_RECON_LOCK_TTL_SECONDS') ?? '55'
    );
    const acquired = await this.redis.baseClient.set(
      this.lockKey,
      lockToken,
      'EX',
      Math.max(10, lockTtlSec),
      'NX'
    );
    if (acquired !== 'OK') {
      return;
    }

    try {
      await this.runOnce();
    } catch (err) {
      this.logger.error(`Reconciliation run failed: ${String(err)}`);
    } finally {
      const lockValue = await this.redis.baseClient.get(this.lockKey);
      if (lockValue === lockToken) {
        await this.redis.baseClient.del(this.lockKey);
      }
    }
  }

  async runOnce(): Promise<void> {
    const staleMinutes = Number(
      this.configService.get<string>('PAYMENT_RECON_STALE_MINUTES') ?? '15'
    );
    const threshold = new Date(Date.now() - staleMinutes * 60 * 1000);

    const stalePayments = await this.prisma.payments.findMany({
      where: {
        status: { in: [PaymentStatus.PROCESSING, PaymentStatus.PENDING] },
        created_at: { lte: threshold },
      },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            payment_status: true,
          },
        },
      },
      take: 200,
      orderBy: { created_at: 'asc' },
    });
    if (stalePayments.length === 0) {
      this.logger.log('No stale payments found for reconciliation');
      return;
    }

    for (const payment of stalePayments) {
      await this.reconcileOne(payment);
    }
  }

  private async reconcileOne(payment: any): Promise<void> {
    try {
      const providerRef =
        (payment.metadata as Record<string, unknown> | null)?.providerTransactionId;
      const adapter = this.resolveAdapter(payment.payment_method as PaymentMethod);

      let authoritative: 'COMPLETED' | 'FAILED' | 'PENDING' | 'UNKNOWN' = 'UNKNOWN';
      let providerTransactionId: string | undefined;
      if (typeof providerRef === 'string' && adapter.queryPaymentStatus) {
        const queried = await adapter.queryPaymentStatus(providerRef);
        authoritative = queried.status;
        providerTransactionId = queried.providerTransactionId;
      }

      if (authoritative === 'PENDING' || authoritative === 'UNKNOWN') {
        this.logger.log(
          `Reconciliation deferred paymentId=${payment.id} authoritative=${authoritative}`
        );
        return;
      }

      if (authoritative === 'COMPLETED') {
        this.transitionPolicy.assertTransition(payment.status, PaymentStatus.COMPLETED);
        await this.prisma.$transaction([
          this.prisma.payments.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.COMPLETED,
              paid_at: payment.paid_at ?? new Date(),
              provider_transaction_id:
                payment.provider_transaction_id ?? providerTransactionId ?? null,
            },
          }),
          this.prisma.bookings.update({
            where: { id: payment.booking_id },
            data: {
              status: BookingStatus.CONFIRMED,
              payment_status: PaymentStatus.COMPLETED,
              expires_at: null,
            },
          }),
          this.prisma.tickets.updateMany({
            where: { booking_id: payment.booking_id },
            data: { status: TicketStatus.VALID },
          }),
        ]);
        this.logger.log(
          `Payment transition audited decision=reconcile_complete paymentId=${payment.id}`
        );
        return;
      }

      if (authoritative === 'FAILED') {
        this.transitionPolicy.assertTransition(payment.status, PaymentStatus.FAILED);
        await this.prisma.$transaction([
          this.prisma.payments.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.FAILED },
          }),
          this.prisma.bookings.update({
            where: { id: payment.booking_id },
            data: {
              status: BookingStatus.CANCELLED,
              payment_status: PaymentStatus.FAILED,
            },
          }),
          this.prisma.tickets.updateMany({
            where: { booking_id: payment.booking_id },
            data: { status: TicketStatus.CANCELLED },
          }),
        ]);
        this.logger.log(
          `Payment transition audited decision=reconcile_fail paymentId=${payment.id}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Payment transition audited decision=reconcile_error paymentId=${payment.id} error=${String(
          error
        )}`
      );
    }
  }

  private resolveAdapter(method: PaymentMethod): PaymentAdapter {
    const adapter = this.adapters.find((a) => a.method === method);
    if (!adapter) {
      throw new Error(`No adapter for payment method ${method}`);
    }
    return adapter;
  }
}
