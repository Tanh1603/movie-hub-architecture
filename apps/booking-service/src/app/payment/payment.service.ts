import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';
import { TicketService } from '../ticket/ticket.service';
import {
  CreatePaymentDto,
  PaymentDetailDto,
  PaymentStatus,
  PaymentMethod,
  BookingStatus,
  TicketStatus,
  ServiceResult,
  AdminFindAllPaymentsDto,
  UserMessage,
  UserDetailDto,
  SERVICE_NAME,
  SECURITY_METRICS,
  BookingDetailDto,
  ResponseMessage,
} from '@movie-hub/shared-types';
import * as crypto from 'crypto';
import { BookingEventService } from '../redis/booking-event.service';
import { PaymentAdapter } from './adapters/payment-adapter.interface';
import { PAYMENT_ADAPTERS } from './payment.constants';
import { WebhookReplayGuardService } from './webhook-replay-guard.service';
import { PaymentTransitionPolicyService } from './payment-transition-policy.service';
import { NotificationOutboxService } from '../notification/notification-outbox.service';
import { InjectSecurityMetric } from '@movie-hub/shared-metrics';
import { Counter } from 'prom-client';
import {
  serializeStructuredLog,
  sanitizeForLogging,
  RequestContextMetadata,
} from '@movie-hub/shared-types/common';

const MAX_PAGE_LIMIT = 50;

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);
  private readonly providerTimeoutMs = 30_000;
  private readonly paymentAdaptersByMethod: Map<PaymentMethod, PaymentAdapter>;

  constructor(
    private prisma: PrismaService,
    private bookingEventService: BookingEventService,
    private webhookReplayGuardService: WebhookReplayGuardService,
    private paymentTransitionPolicy: PaymentTransitionPolicyService,
    private notificationOutboxService: NotificationOutboxService,
    @Inject(SERVICE_NAME.USER) private userClient: ClientProxy,
    private notificationService: NotificationService,
    private ticketService: TicketService,
    @Inject(PAYMENT_ADAPTERS) paymentAdapters: PaymentAdapter[],
    @InjectSecurityMetric(SECURITY_METRICS.WEBHOOK_SIGNATURE_FAIL)
    private readonly webhookSignatureFailCounter: Counter<string>,
    @InjectSecurityMetric(SECURITY_METRICS.WEBHOOK_REPLAY_DETECTED)
    private readonly webhookReplayDetectedCounter: Counter<string>,
    @InjectSecurityMetric(SECURITY_METRICS.WEBHOOK_STALE_REJECTED)
    private readonly webhookStaleRejectedCounter: Counter<string>
  ) {
    this.paymentAdaptersByMethod = new Map(
      paymentAdapters.map((adapter) => [adapter.method, adapter])
    );
  }

  async onModuleInit() {
    this.notificationOutboxService.setConsumerCallback(async (payload) => {
      try {
        await this.sendBookingConfirmationEmailAsync(payload.bookingId);
        return true;
      } catch (e) {
        this.logger.error('Failed to send confirmation', e);
        return false;
      }
    });
  }

  private logInfo(
    action: string,
    message: string,
    metadata?: Record<string, unknown>,
    context?: Partial<RequestContextMetadata>
  ) {
    this.logger.log({ action, metadata }, message);
  }

  private logWarn(
    action: string,
    message: string,
    metadata?: Record<string, unknown>,
    context?: Partial<RequestContextMetadata>
  ) {
    this.logger.warn({ action, metadata }, message);
  }

  private logError(
    action: string,
    error: unknown,
    metadata?: Record<string, unknown>,
    context?: Partial<RequestContextMetadata>
  ) {
    const errorObject =
      error instanceof Error ? error : new Error(String(error));

    this.logger.error({ action, metadata, errorCode: errorObject.name, error: String(error) }, errorObject.message);
  }

  private normalizePagination(page?: number, limit?: number) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(
      MAX_PAGE_LIMIT,
      Math.max(1, Number(limit) || 10)
    );
    return {
      page: safePage,
      limit: safeLimit,
      skip: (safePage - 1) * safeLimit,
    };
  }

  async createPayment(
    bookingId: string,
    dto: CreatePaymentDto,
    ipAddr: string,
    userId: string,
    context?: RequestContextMetadata
  ): Promise<ServiceResult<PaymentDetailDto>> {
    const traceId = crypto.randomUUID();
    const booking = await this.getBookingForPaymentOrThrow(bookingId);
    const paymentMethod = dto.paymentMethod ?? PaymentMethod.VNPAY;
    const paymentAmount = Number(booking.final_amount);

    // Handle zero-amount payment (e.g., 100% voucher coverage)
    // Relax check to < 1000 to handle potential precision issues or edge cases
    if (paymentAmount < 1000) {
      return this.handleZeroAmountPayment(booking, dto, context);
    }

    const idempotencyKey = this.generateIdempotencyKey(
      booking.id,
      paymentMethod,
      paymentAmount
    );

    const existingPayment = await this.prisma.payments.findUnique({
      where: { transaction_id: idempotencyKey },
    });

    if (existingPayment) {
      return { data: this.mapToDto(existingPayment) };
    }

    let payment: any;
    try {
      payment = await this.prisma.payments.create({
        data: {
          booking_id: bookingId,
          amount: paymentAmount,
          payment_method: paymentMethod,
          status: PaymentStatus.PROCESSING,
          transaction_id: idempotencyKey,
          metadata: this.buildSafeMetadata(
            PaymentStatus.PROCESSING,
            paymentAmount,
            {
              timestampKey: 'initiatedAt',
              transactionId: idempotencyKey,
            }
          ),
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        const racedPayment = await this.prisma.payments.findUnique({
          where: { transaction_id: idempotencyKey },
        });
        if (racedPayment) {
          return { data: this.mapToDto(racedPayment) };
        }
      }
      throw error;
    }

    try {
      const adapter = this.resolveAdapter(paymentMethod);
      const initiation = await this.runWithTimeout(
        adapter.initiatePayment({
          paymentId: payment.id,
          bookingId: booking.id,
          amount: paymentAmount,
          ipAddr,
          expiresAt: booking.expires_at,
          returnUrl: dto.returnUrl,
          cancelUrl: dto.cancelUrl,
          idempotencyKey,
          traceId,
        }),
        this.providerTimeoutMs
      );
      this.paymentTransitionPolicy.assertTransition(
        payment.status as PaymentStatus,
        PaymentStatus.PENDING
      );

      const updated = await this.prisma.payments.update({
        where: { id: payment.id },
        data: {
          // PROCESSING -> PENDING transition
          status: PaymentStatus.PENDING,
          payment_url: initiation.paymentUrl,
          metadata: this.buildSafeMetadata(
            PaymentStatus.PENDING,
            paymentAmount,
            {
              timestampKey: 'initiatedAt',
              transactionId: idempotencyKey,
              providerTransactionId: initiation.externalTransactionRef,
            }
          ),
        },
      });

      return { data: this.mapToDto(updated) };
    } catch (error) {
      this.paymentTransitionPolicy.assertTransition(
        payment.status as PaymentStatus,
        PaymentStatus.FAILED
      );
      await this.prisma.payments.update({
        where: { id: payment.id },
        data: {
          // PROCESSING -> FAILED transition
          status: PaymentStatus.FAILED,
          metadata: this.buildSafeMetadata(
            PaymentStatus.FAILED,
            paymentAmount,
            {
              timestampKey: 'failedAt',
              transactionId: idempotencyKey,
            }
          ),
        },
      });

      const failureClass = this.classifyInitiationError(error);
      this.logger.error(
        `Payment initiation failed bookingId=${bookingId} paymentId=${payment.id} class=${failureClass} traceId=${traceId}`
      );
      throw new Error('Unable to initiate payment. Please retry later.');
    }
  }

  /**
   * Handle zero-amount payment (e.g., 100% voucher coverage)
   * Skip VNPay and directly confirm the booking
   */
  private async handleZeroAmountPayment(
    booking: {
      id: string;
      user_id: string;
      showtime_id: string;
      final_amount: any;
      payment_status: string;
      expires_at: Date | null;
      promotion_code: string | null;
      customer_name: string;
      customer_email: string;
      customer_phone: string | null;
    },
    dto: CreatePaymentDto,
    context?: RequestContextMetadata
  ): Promise<ServiceResult<PaymentDetailDto>> {
    const paymentMethod = dto.paymentMethod ?? PaymentMethod.VNPAY;
    this.logInfo(
      'payment.zero_amount.started',
      'Confirming zero-amount booking',
      {
        bookingId: booking.id,
        userId: booking.user_id,
        showtimeId: booking.showtime_id,
        paymentMethod: dto.paymentMethod,
      },
      context
    );

    // Use transaction to create payment and confirm booking atomically
    const payment = await this.prisma.$transaction(async (tx) => {
      // Create payment record marked as COMPLETED
      const newPayment = await tx.payments.create({
        data: {
          booking_id: booking.id,
          amount: 0,
          payment_method: paymentMethod,
          status: PaymentStatus.COMPLETED,
          paid_at: new Date(),
          metadata: this.buildSafeMetadata(PaymentStatus.COMPLETED, 0, {
            timestampKey: 'paidAt',
          }),
        },
      });

      // Update booking status to CONFIRMED
      await tx.bookings.update({
        where: { id: booking.id },
        data: {
          payment_status: PaymentStatus.COMPLETED,
          status: BookingStatus.CONFIRMED,
          expires_at: null,
        },
      });

      // Update ticket statuses to VALID
      await tx.tickets.updateMany({
        where: { booking_id: booking.id },
        data: { status: TicketStatus.VALID },
      });

      // If a promotion was used, increment its usage count
      if (booking.promotion_code) {
        await tx.promotions.update({
          where: { code: booking.promotion_code },
          data: { current_usage: { increment: 1 } },
        });
        this.logInfo(
          'payment.zero_amount.promotion_applied',
          'Incremented promotion usage',
          {
            bookingId: booking.id,
            promotionCode: booking.promotion_code,
          },
          context
        );
      }
      
      // Enqueue booking confirmation in outbox within the transaction
      await this.notificationOutboxService.enqueueBookingConfirmed(tx, {
        bookingId: booking.id,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone || undefined,
      });

      return newPayment;
    });

    // Publish booking completed event to Redis (fire-and-forget)
    try {
      const tickets = await this.prisma.tickets.findMany({
        where: { booking_id: booking.id },
        select: { seat_id: true },
      });

      await this.bookingEventService.publishBookingConfirmed({
        userId: booking.user_id,
        showtimeId: booking.showtime_id,
        bookingId: booking.id,
        seatIds: tickets.map((t) => t.seat_id),
      });
      this.logInfo(
        'booking.confirmed.event_published',
        'Published booking confirmation event',
        {
          bookingId: booking.id,
          seatCount: tickets.length,
        },
        context
      );
    } catch (eventError) {
      this.logWarn(
        'booking.confirmed.event_publish_warning',
        'Failed to publish booking confirmation event',
        {
          bookingId: booking.id,
          error: String(eventError),
        },
        context
      );
    }

    // Email will be sent asynchronously via the NotificationOutbox poller

    this.logInfo(
      'payment.zero_amount.completed',
      'Zero-amount payment completed',
      {
        bookingId: booking.id,
      },
      context
    );

    // Return payment with a special marker indicating no redirect is needed
    const paymentDto = this.mapToDto(payment);
    // Set paymentUrl to the success returnUrl since payment is already complete
    paymentDto.paymentUrl = dto.returnUrl;

    return {
      data: paymentDto,
      message: ResponseMessage.MSG_7,
    };
  }

  async handleProviderIPN(
    provider: PaymentMethod,
    params: Record<string, string>,
    context?: RequestContextMetadata
  ): Promise<ServiceResult<Record<string, unknown>>> {
    const adapter = this.resolveAdapter(provider);
    try {
      const callback = adapter.parseIPN(params);
      if (!callback.validSignature) {
        await this.webhookReplayGuardService.auditSuspiciousCallback(
          provider,
          'invalid_signature',
          {
            hasOrderId: Boolean(callback.orderId),
            hasTransactionId: Boolean(callback.transactionId),
          }
        );
        this.webhookSignatureFailCounter.inc({ provider: String(provider).toLowerCase() });
        return { data: adapter.buildIPNResponse('invalid_signature') };
      }

      // Validation order: signature ✓ → timestamp freshness → dedup → state transition
      const freshness = this.webhookReplayGuardService.assertTimestampFresh(
        callback.callbackTimestamp
      );
      if (!freshness.fresh) {
        await this.webhookReplayGuardService.auditSuspiciousCallback(
          provider,
          'stale_callback',
          {
            callbackTimestamp: callback.callbackTimestamp,
            serverTime: Date.now(),
            ageMs: callback.callbackTimestamp
              ? Date.now() - callback.callbackTimestamp
              : 'unknown',
          }
        );
        this.webhookStaleRejectedCounter.inc({ provider: String(provider).toLowerCase() });
        // Return 200 ack to prevent provider retry storm, but perform no mutation
        return { data: adapter.buildIPNResponse('stale_callback') };
      }

      const dedupIdentity =
        callback.transactionId ||
        callback.orderId ||
        params.app_trans_id ||
        params.vnp_TxnRef;
      if (!dedupIdentity) {
        await this.webhookReplayGuardService.auditSuspiciousCallback(
          provider,
          'missing_callback_identity',
          {}
        );
        return { data: adapter.buildIPNResponse('internal_error') };
      }

      const dedup = await this.webhookReplayGuardService.markIfFirstSeen(
        provider,
        dedupIdentity
      );
      if (dedup.duplicate) {
        await this.webhookReplayGuardService.auditSuspiciousCallback(
          provider,
          'duplicate',
          { dedupIdentity }
        );
        this.webhookReplayDetectedCounter.inc({ provider: String(provider).toLowerCase() });
        return { data: adapter.buildIPNResponse('already_processed') };
      }

      const orderId = callback.orderId;
      const transactionId = callback.transactionId;
      const amount = callback.amount;
      let payment = await this.prisma.payments.findUnique({
        where: { id: orderId },
        include: {
          booking: {
            select: {
              id: true,
              user_id: true,
              showtime_id: true,
              status: true,
              payment_status: true,
              expires_at: true,
              customer_name: true,
              customer_email: true,
              customer_phone: true,
            },
          },
        },
      });
      if (!payment && orderId) {
        payment = await this.prisma.payments.findUnique({
          where: { transaction_id: orderId },
          include: {
            booking: {
              select: {
                id: true,
                user_id: true,
                showtime_id: true,
                status: true,
                payment_status: true,
                expires_at: true,
                customer_name: true,
                customer_email: true,
                customer_phone: true,
              },
            },
          },
        });
      }

      if (!payment) {
        return { data: adapter.buildIPNResponse('order_not_found') };
      }

      if (
        payment.booking.expires_at &&
        new Date() > payment.booking.expires_at
      ) {
        return { data: adapter.buildIPNResponse('expired') };
      }

      if (Number(payment.amount) !== amount) {
        return { data: adapter.buildIPNResponse('amount_invalid') };
      }

      if (
        payment.status !== PaymentStatus.PENDING ||
        payment.booking.status !== BookingStatus.PENDING
      ) {
        return { data: adapter.buildIPNResponse('already_processed') };
      }

      if (callback.isSuccess) {
        this.paymentTransitionPolicy.assertTransition(
          payment.status as PaymentStatus,
          PaymentStatus.COMPLETED
        );
        // First, get the booking to check for promotion_code
        const bookingWithPromotion = await this.prisma.bookings.findUnique({
          where: { id: payment.booking_id },
          select: { promotion_code: true },
        });

        // Use interactive transaction to handle all updates atomically
        await this.prisma.$transaction(async (tx) => {
          // Update payment status
          await tx.payments.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.COMPLETED,
              provider_transaction_id: transactionId,
              paid_at: new Date(),
            },
          });

          // Update booking status
          await tx.bookings.update({
            where: { id: payment.booking_id },
            data: {
              payment_status: PaymentStatus.COMPLETED,
              status: BookingStatus.CONFIRMED,
              expires_at: null,
            },
          });

          // Update ticket statuses
          await tx.tickets.updateMany({
            where: { booking_id: payment.booking_id },
            data: { status: TicketStatus.VALID },
          });

          // If a promotion was used, increment its usage count
          if (bookingWithPromotion?.promotion_code) {
            await tx.promotions.update({
              where: { code: bookingWithPromotion.promotion_code },
              data: { current_usage: { increment: 1 } },
            });
            this.logger.log(
              `[VNPay IPN] Incrementing usage for promotion: ${bookingWithPromotion.promotion_code}`
            );
          }
          
          // Enqueue booking confirmation in outbox within the transaction
          await this.notificationOutboxService.enqueueBookingConfirmed(tx, {
            bookingId: payment.booking_id,
            customerName: payment.booking.customer_name,
            customerEmail: payment.booking.customer_email,
            customerPhone: payment.booking.customer_phone || undefined,
          });
        });

        // Publish booking completed event to Redis
        try {
          const tickets = await this.prisma.tickets.findMany({
            where: { booking_id: payment.booking_id },
            select: { seat_id: true },
          });

          await this.bookingEventService.publishBookingConfirmed({
            userId: payment.booking.user_id,
            showtimeId: payment.booking.showtime_id,
            bookingId: payment.booking_id,
            seatIds: tickets.map((t) => t.seat_id),
          });
        } catch (eventError) {
          this.logger.warn('[VNPay IPN] Event publish warning');
          // Non-critical
        }

        // Email will be sent asynchronously via the NotificationOutbox poller

        return { data: adapter.buildIPNResponse('processed') };
      } else {
        this.paymentTransitionPolicy.assertTransition(
          payment.status as PaymentStatus,
          PaymentStatus.FAILED
        );
        await this.prisma.$transaction([
          this.prisma.payments.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.FAILED },
          }),
          this.prisma.bookings.update({
            where: { id: payment.booking_id },
            data: {
              payment_status: PaymentStatus.FAILED,
              status: BookingStatus.CANCELLED,
            },
          }),
          this.prisma.tickets.updateMany({
            where: { booking_id: payment.booking_id },
            data: { status: TicketStatus.CANCELLED },
          }),
        ]);

        return { data: adapter.buildIPNResponse('processed') };
      }
    } catch (error) {
      this.logger.error('[VNPay IPN] Critical Error');
      return { data: adapter.buildIPNResponse('internal_error') };
    }
  }
  //  //## DONT USE THIS , use ipn instead
  async handleProviderReturn(
    provider: PaymentMethod,
    params: Record<string, string>
  ): Promise<ServiceResult<{ status: string; code: string }>> {
    const adapter = this.resolveAdapter(provider);
    const callback = adapter.parseReturn(params);
    return { data: adapter.buildReturnResponse(callback) };
  }

  async findOne(
    id: string,
    userId?: string
  ): Promise<ServiceResult<PaymentDetailDto>> {
    const payment = await this.prisma.payments.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            user_id: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (userId && payment.booking.user_id !== userId) {
      throw new Error('Payment not found');
    }

    return { data: this.mapToDto(payment) };
  }

  async findByBooking(
    bookingId: string,
    userId: string
  ): Promise<ServiceResult<PaymentDetailDto[]>> {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      select: { user_id: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.user_id !== userId) {
      throw new Error('You do not have access to this booking payments');
    }

    const payments = await this.prisma.payments.findMany({
      where: { booking_id: bookingId },
      orderBy: { created_at: 'desc' },
    });

    return { data: payments.map((payment) => this.mapToDto(payment)) };
  }

  private async getBookingForPaymentOrThrow(bookingId: string) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        user_id: true,
        showtime_id: true,
        final_amount: true,
        payment_status: true,
        expires_at: true,
        promotion_code: true,
        customer_name: true,
        customer_email: true,
        customer_phone: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.payment_status !== PaymentStatus.PENDING) {
      throw new Error('Booking is not pending payment');
    }

    if (!booking.expires_at) {
      throw new Error('Booking payment window has expired');
    }

    return booking as typeof booking & { expires_at: Date };
  }

  private generateIdempotencyKey(
    bookingId: string,
    paymentMethod: PaymentMethod,
    amount: number
  ): string {
    const context = `${bookingId}:${paymentMethod}:${amount.toFixed(2)}`;
    return `pay_init_${crypto
      .createHash('sha256')
      .update(context)
      .digest('hex')}`;
  }

  private resolveAdapter(paymentMethod: PaymentMethod): PaymentAdapter {
    const adapter = this.paymentAdaptersByMethod.get(paymentMethod);
    if (!adapter) {
      throw new Error(`Payment method ${paymentMethod} is not supported`);
    }
    return adapter;
  }

  private async runWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error('PAYMENT_PROVIDER_TIMEOUT'));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private classifyInitiationError(error: unknown): string {
    const message = String((error as Error)?.message ?? '').toUpperCase();
    if (message.includes('TIMEOUT')) {
      return 'TIMEOUT';
    }
    if (message.includes('NETWORK') || message.includes('ECONN')) {
      return 'NETWORK';
    }
    return 'PROVIDER_FAILURE';
  }

  private isUniqueConstraintError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const code = (error as { code?: string }).code;
    return code === 'P2002';
  }

  private buildSafeMetadata(
    status: PaymentStatus,
    amount: number,
    options?: {
      timestampKey?: 'initiatedAt' | 'failedAt' | 'paidAt';
      transactionId?: string;
      providerTransactionId?: string;
    }
  ): any {
    const timestampKey = options?.timestampKey ?? 'initiatedAt';
    const metadata: Record<string, unknown> = {
      status,
      amount,
      [timestampKey]: new Date().toISOString(),
    };
    if (options?.transactionId) {
      metadata.transactionId = options.transactionId;
    }
    if (options?.providerTransactionId) {
      metadata.providerTransactionId = options.providerTransactionId;
    }
    return metadata;
  }

  private mapToDto(payment: any): PaymentDetailDto {
    return {
      id: payment.id,
      bookingId: payment.booking_id,
      amount: Number(payment.amount),
      paymentMethod: payment.payment_method as PaymentMethod,
      status: payment.status as PaymentStatus,
      transactionId: payment.transaction_id,
      providerTransactionId: payment.provider_transaction_id,
      paymentUrl: payment.payment_url,
      paidAt: payment.paid_at,
      metadata: payment.metadata,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
    };
  }

  // ==================== ADMIN OPERATIONS ====================

  /**
   * Admin: Find all payments with comprehensive filters
   */
  async adminFindAllPayments(
    filters: AdminFindAllPaymentsDto = {}
  ): Promise<ServiceResult<PaymentDetailDto[]>> {
    const { page, limit, skip } = this.normalizePagination(
      filters.page,
      filters.limit
    );

    const where: any = {};

    if (filters?.bookingId) where.booking_id = filters.bookingId;
    if (filters?.status) where.status = filters.status;
    if (filters?.paymentMethod) where.payment_method = filters.paymentMethod;

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = filters.startDate;
      if (filters.endDate) where.created_at.lte = filters.endDate;
    }

    const orderBy: any = {};
    const sortBy = filters?.sortBy || 'created_at';
    const sortOrder = filters?.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const [payments, total] = await Promise.all([
      this.prisma.payments.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.payments.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: payments.map((p) => this.mapToDto(p)),
      meta: {
        page,
        limit,
        totalRecords: total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  /**
   * Find payments by status
   */
  async findPaymentsByStatus(
    status: PaymentStatus,
    pageDto = 1,
    limitDto = 10
  ): Promise<ServiceResult<PaymentDetailDto[]>> {
    const { page, limit, skip } = this.normalizePagination(pageDto, limitDto);

    const [payments, total] = await Promise.all([
      this.prisma.payments.findMany({
        where: { status },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payments.count({ where: { status } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: payments.map((p) => this.mapToDto(p)),
      meta: {
        page,
        limit,
        totalRecords: total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  /**
   * Find payments by date range
   */
  async findPaymentsByDateRange(
    filters: {
      startDate?: Date;
      endDate?: Date;
      status?: PaymentStatus;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ServiceResult<PaymentDetailDto[]>> {
    const { page, limit, skip } = this.normalizePagination(
      filters.page,
      filters.limit
    );

    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = filters.startDate;
      if (filters.endDate) where.created_at.lte = filters.endDate;
    }

    if (filters?.status) where.status = filters.status;

    const [payments, total] = await Promise.all([
      this.prisma.payments.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payments.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: payments.map((p) => this.mapToDto(p)),
      meta: {
        page,
        limit,
        totalRecords: total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  /**
   * Cancel a pending payment
   */
  async cancelPayment(
    paymentId: string
  ): Promise<ServiceResult<PaymentDetailDto>> {
    const payment = await this.prisma.payments.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error('Can only cancel pending payments');
    }
    this.paymentTransitionPolicy.assertTransition(
      payment.status as PaymentStatus,
      PaymentStatus.FAILED
    );

    const updated = await this.prisma.payments.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.FAILED },
    });

    return { data: this.mapToDto(updated) };
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(
    filters: {
      startDate?: Date;
      endDate?: Date;
      paymentMethod?: string;
    } = {}
  ): Promise<ServiceResult<any>> {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = filters.startDate;
      if (filters.endDate) where.created_at.lte = filters.endDate;
    }

    if (filters?.paymentMethod) where.payment_method = filters.paymentMethod;

    const [
      totalPayments,
      successfulPayments,
      failedPayments,
      pendingPayments,
      payments,
    ] = await Promise.all([
      this.prisma.payments.count({ where }),
      this.prisma.payments.count({
        where: { ...where, status: PaymentStatus.COMPLETED },
      }),
      this.prisma.payments.count({
        where: { ...where, status: PaymentStatus.FAILED },
      }),
      this.prisma.payments.count({
        where: { ...where, status: PaymentStatus.PENDING },
      }),
      this.prisma.payments.findMany({ where }),
    ]);

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const completedPayments = payments.filter(
      (p) => p.status === PaymentStatus.COMPLETED
    );
    const completedAmount = completedPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    // Group by payment method
    const paymentsByMethod = payments.reduce((acc: any, p) => {
      const method = p.payment_method;
      if (!acc[method]) {
        acc[method] = { method, count: 0, amount: 0 };
      }
      acc[method].count++;
      acc[method].amount += Number(p.amount);
      return acc;
    }, {});

    // Group by status
    const paymentsByStatus = payments.reduce((acc: any, p) => {
      const status = p.status;
      if (!acc[status]) {
        acc[status] = { status, count: 0, amount: 0 };
      }
      acc[status].count++;
      acc[status].amount += Number(p.amount);
      return acc;
    }, {});

    return {
      data: {
        totalPayments,
        totalAmount,
        successfulPayments,
        failedPayments,
        pendingPayments,
        successRate:
          totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
        averagePaymentAmount:
          totalPayments > 0 ? totalAmount / totalPayments : 0,
        paymentsByMethod: Object.values(paymentsByMethod),
        paymentsByStatus: Object.values(paymentsByStatus),
        period:
          filters.startDate && filters.endDate
            ? {
                startDate: filters.startDate,
                endDate: filters.endDate,
              }
            : undefined,
      },
    };
  }

  /**
   * Send booking confirmation email ASYNCHRONOUSLY with QR codes
   * This runs in background and never blocks the payment flow
   * Fetches user details (email, name, phone) from user service via event-driven TCP call
   */
  private async sendBookingConfirmationEmailAsync(
    bookingId: string
  ): Promise<void> {
    try {
      const fullBooking = await this.prisma.bookings.findUnique({
        where: { id: bookingId },
        include: {
          tickets: true,
          booking_concessions: {
            include: { concession: true },
          },
        },
      });

      if (!fullBooking) {
        this.logWarn(
          'booking.confirmed.email_booking_missing',
          'Booking not found while preparing confirmation email',
          {
            bookingId,
          }
        );
        return;
      }

      // ✅ ASYNC: Fetch user details from USER service via TCP (event-driven)
      let userDetails: UserDetailDto | null = null;
      try {
        userDetails = await firstValueFrom(
          this.userClient.send<UserDetailDto>(
            UserMessage.GET_USER_DETAIL,
            fullBooking.user_id
          )
        );
        this.logInfo(
          'booking.confirmed.email_user_loaded',
          'Fetched user details for confirmation email',
          {
            bookingId,
            userId: fullBooking.user_id,
          }
        );
      } catch (userError) {
        this.logWarn(
          'booking.confirmed.email_user_lookup_failed',
          'Failed to fetch user details from user service',
          {
            bookingId,
            userId: fullBooking.user_id,
            error: sanitizeForLogging(userError),
          }
        );
        // Gracefully fall back to booking's stored customer info
        this.logInfo(
          'booking.confirmed.email_fallback_customer_info',
          'Falling back to booking-stored customer information',
          {
            bookingId,
          }
        );
      }

      // Use user details if available, otherwise use booking's stored customer info
      const customerEmail = userDetails?.email || fullBooking.customer_email;
      const customerName = userDetails?.fullName || fullBooking.customer_name;
      const customerPhone =
        userDetails?.phone || fullBooking.customer_phone || undefined;

      // Generate QR codes for all tickets IN PARALLEL
      const ticketsWithQR = await Promise.all(
        (fullBooking.tickets || []).map(async (ticket) => {
          try {
            const qrResult = await this.ticketService.generateQRCode(ticket.id);
            return {
              ticketCode: ticket.ticket_code,
              seatNumber: `${ticket.seat_id}`, // TODO: Parse actual seat row/number
              ticketType: ticket.ticket_type,
              price: Number(ticket.price),
              qrCode: qrResult.data,
            };
          } catch (qrError) {
            this.logWarn(
              'booking.confirmed.ticket_qr_failed',
              'Failed to generate QR code for ticket',
              {
                bookingId,
                ticketId: ticket.id,
                error: sanitizeForLogging(qrError),
              }
            );
            // Return ticket without QR code
            return {
              ticketCode: ticket.ticket_code,
              seatNumber: `${ticket.seat_id}`,
              ticketType: ticket.ticket_type,
              price: Number(ticket.price),
              qrCode: '', // Empty if QR generation fails
            };
          }
        })
      );

      // Map to BookingDetailDto format
      const bookingForEmail: BookingDetailDto = {
        id: fullBooking.id,
        bookingCode: fullBooking.booking_code,
        showtimeId: fullBooking.showtime_id,
        userId: fullBooking.user_id,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        movieTitle: 'Movie Title', // TODO: Fetch from cinema-service
        cinemaName: 'Cinema Name', // TODO: Fetch from cinema-service
        hallName: 'Hall Name', // TODO: Fetch from cinema-service
        startTime: new Date(), // TODO: Fetch from cinema-service
        seatCount: fullBooking.tickets?.length || 0,
        seats:
          fullBooking.tickets?.map((t) => ({
            seatId: t.seat_id,
            row: 'A', // TODO: Parse from seat_id
            number: 1, // TODO: Parse from seat_id
            seatType: t.ticket_type,
            ticketType: t.ticket_type,
            price: Number(t.price),
          })) || [],
        concessions:
          fullBooking.booking_concessions?.map((bc) => ({
            concessionId: bc.concession_id,
            name: bc.concession?.name || 'Item',
            quantity: bc.quantity,
            unitPrice: Number(bc.unit_price),
            totalPrice: Number(bc.total_price),
          })) || [],
        subtotal: Number(fullBooking.subtotal),
        discount: Number(fullBooking.discount),
        pointsUsed: fullBooking.points_used,
        pointsDiscount: Number(fullBooking.points_discount),
        finalAmount: Number(fullBooking.final_amount),
        totalAmount: Number(fullBooking.final_amount),
        promotionCode: fullBooking.promotion_code || undefined,
        status: fullBooking.status as BookingStatus,
        paymentStatus: fullBooking.payment_status as PaymentStatus,
        expiresAt: fullBooking.expires_at || undefined,
        cancelledAt: fullBooking.cancelled_at || undefined,
        cancellationReason: fullBooking.cancellation_reason || undefined,
        createdAt: fullBooking.created_at,
        updatedAt: fullBooking.updated_at,
      };

      // Send email with tickets and QR codes
      await this.notificationService.sendBookingConfirmation({
        booking: bookingForEmail,
        tickets: ticketsWithQR,
      });

      this.logInfo(
        'booking.confirmed.email_sent',
        'Booking confirmation email sent successfully',
        {
          bookingId,
          customerEmail,
          ticketCount: ticketsWithQR.length,
        }
      );

      // Also send SMS if phone number available (fire-and-forget)
      if (customerPhone) {
        this.notificationService
          .sendBookingConfirmationSMS(bookingForEmail)
          .catch((smsError) => {
            this.logWarn(
              'booking.confirmed.sms_failed',
              'Failed to send booking confirmation SMS',
              {
                bookingId,
                customerPhone,
                error: sanitizeForLogging(smsError),
              }
            );
          });
      }
    } catch (error) {
      this.logError('booking.confirmed.email_failed', error, {
        bookingId,
      });
      // Don't throw - this is already async and shouldn't affect payment
    }
  }
}
