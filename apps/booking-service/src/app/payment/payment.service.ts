import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '../prisma.service';
import {
  NotificationService,
  TicketWithQRCode,
} from '../notification/notification.service';
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
  UserDetailDto,
  BookingDetailDto,
  SERVICE_NAME,
  UserMessage,
} from '@movie-hub/shared-types';
import { firstValueFrom, timeout } from 'rxjs';
import { BookingEventService } from '../redis/booking-event.service';
import { PaymentStrategyFactory } from './strategies/payment-strategy.factory';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly maxRetryAttempts = 3;
  private readonly retryBackoffMs = [1000, 2000, 4000];
  private readonly getUserDetailTimeoutMs = 10000;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private bookingEventService: BookingEventService,
    @Inject(SERVICE_NAME.USER) private readonly userClient: ClientProxy,
    private notificationService: NotificationService,
    private ticketService: TicketService,
    private strategyFactory: PaymentStrategyFactory
  ) {}

  async createPayment(
    bookingId: string,
    dto: CreatePaymentDto,
    ipAddr: string
  ): Promise<ServiceResult<PaymentDetailDto>> {
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
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.payment_status !== PaymentStatus.PENDING) {
      throw new Error('Booking is not pending payment');
    }

    // Use booking's final_amount
    const paymentAmount = Number(booking.final_amount);

    // Handle zero-amount payment (e.g., 100% voucher coverage)
    // Relax check to < 1000 to handle potential precision issues or edge cases
    if (paymentAmount < 1000) {
      return this.handleZeroAmountPayment(booking, dto);
    }

    const payment = await this.prisma.payments.create({
      data: {
        booking_id: bookingId,
        amount: paymentAmount,
        payment_method: dto.paymentMethod ?? PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
        metadata: {
          returnUrl: dto.returnUrl,
          cancelUrl: dto.cancelUrl,
        },
      },
    });

    // Use strategy to generate payment URL based on payment method
    const paymentMethod = dto.paymentMethod ?? PaymentMethod.VNPAY;
    const strategy = this.strategyFactory.getStrategy(paymentMethod);
    const paymentUrl = await strategy.createPaymentUrl(
      payment.id,
      booking.id,
      booking.expires_at || new Date(Date.now() + 15 * 60 * 1000), // Default to 15 mins if expires_at is null
      paymentAmount,
      ipAddr
    );

    await this.prisma.payments.update({
      where: { id: payment.id },
      data: { payment_url: paymentUrl },
    });

    return { data: this.mapToDto({ ...payment, payment_url: paymentUrl }) };
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
    },
    dto: CreatePaymentDto
  ): Promise<ServiceResult<PaymentDetailDto>> {
    console.log(
      `[Payment] Zero-amount payment for booking ${booking.id}, confirming directly`
    );

    // Use transaction to create payment and confirm booking atomically
    const payment = await this.prisma.$transaction(async (tx) => {
      // Create payment record marked as COMPLETED
      const newPayment = await tx.payments.create({
        data: {
          booking_id: booking.id,
          amount: 0,
          payment_method: dto.paymentMethod ?? PaymentMethod.VNPAY,
          status: PaymentStatus.COMPLETED,
          paid_at: new Date(),
          metadata: {
            returnUrl: dto.returnUrl,
            cancelUrl: dto.cancelUrl,
            zeroAmountPayment: true,
          },
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
        console.log(
          `[Payment] Incrementing usage for promotion: ${booking.promotion_code}`
        );
      }

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
      console.log('[Payment] Zero-amount booking event published');
    } catch (eventError) {
      console.error('[Payment] Event publish warning:', eventError);
    }

    // Send booking confirmation email ASYNCHRONOUSLY
    this.sendBookingConfirmationEmailAsync(booking.id).catch((emailError) => {
      console.error(
        '[Payment] Failed to send booking confirmation email (async):',
        emailError
      );
    });

    console.log(
      `[Payment] Zero-amount payment completed for booking ${booking.id}`
    );

    // Return payment with a special marker indicating no redirect is needed
    const paymentDto = this.mapToDto(payment);
    // Set paymentUrl to the success returnUrl since payment is already complete
    paymentDto.paymentUrl = dto.returnUrl;

    return {
      data: paymentDto,
      message: 'Payment completed - order fully covered by voucher',
    };
  }

  /**
   * Handle payment callback/IPN from payment provider
   * Delegates to the appropriate strategy based on payment method
   */
  async handlePaymentIPN(
    paymentMethod: PaymentMethod,
    callbackParams: Record<string, string>
  ): Promise<ServiceResult<{ RspCode: string; Message: string }>> {
    const strategy = this.strategyFactory.getStrategy(paymentMethod);
    return strategy.handlePaymentCallback(callbackParams);
  }

  /**
   * Handle payment return/redirect URL from payment provider
   * Delegates to the appropriate strategy based on payment method
   * Note: This is deprecated for VNPay in favor of IPN
   */
  async handlePaymentReturn(
    paymentMethod: PaymentMethod,
    returnParams: Record<string, string>
  ): Promise<ServiceResult<{ status: string; code: string }>> {
    const strategy = this.strategyFactory.getStrategy(paymentMethod);
    return strategy.handlePaymentReturn(returnParams);
  }

  async findOne(id: string): Promise<ServiceResult<PaymentDetailDto>> {
    const payment = await this.prisma.payments.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return { data: this.mapToDto(payment) };
  }

  async findByBooking(
    bookingId: string
  ): Promise<ServiceResult<PaymentDetailDto[]>> {
    const payments = await this.prisma.payments.findMany({
      where: { booking_id: bookingId },
      orderBy: { created_at: 'desc' },
    });

    return { data: payments.map((payment) => this.mapToDto(payment)) };
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
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

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
    page = 1,
    limit = 10
  ): Promise<ServiceResult<PaymentDetailDto[]>> {
    const skip = (page - 1) * limit;

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
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

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
        console.error('[Email] Booking not found:', bookingId);
        return;
      }

      // ✅ ASYNC: Fetch user details from USER service via TCP (event-driven)
      let userDetails: UserDetailDto | null = null;
      try {
        userDetails = await this.getUserDetail(fullBooking.user_id);
        console.log(
          `[Email] Fetched user details from user service for user ${fullBooking.user_id}`
        );
      } catch (userError) {
        console.error(
          `[Email] Failed to fetch user details from user service:`,
          userError
        );
        // Gracefully fall back to booking's stored customer info
        console.log(
          '[Email] Falling back to booking stored customer information'
        );
      }

      // Use user details if available, otherwise use booking's stored customer info
      const customerEmail = userDetails?.email || fullBooking.customer_email;
      const customerName = userDetails?.fullName || fullBooking.customer_name;
      const customerPhone = userDetails?.phone || fullBooking.customer_phone;

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
            console.error(
              `[Email] Failed to generate QR for ticket ${ticket.id}:`,
              qrError
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
        customerPhone: customerPhone ?? undefined,
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
        promotionCode: fullBooking.promotion_code ?? undefined,
        status: fullBooking.status as BookingStatus,
        paymentStatus: fullBooking.payment_status as PaymentStatus,
        expiresAt: fullBooking.expires_at ?? undefined,
        cancelledAt: fullBooking.cancelled_at ?? undefined,
        cancellationReason: fullBooking.cancellation_reason ?? undefined,
        createdAt: fullBooking.created_at,
        updatedAt: fullBooking.updated_at,
      };

      // Send email with tickets and QR codes
      await this.notificationService.sendBookingConfirmation({
        booking: bookingForEmail,
        tickets: ticketsWithQR,
      });

      console.log(
        `[Email] Booking confirmation sent successfully to ${customerEmail}`
      );

      // Also send SMS if phone number available (fire-and-forget)
      if (customerPhone) {
        this.notificationService
          .sendBookingConfirmationSMS(bookingForEmail)
          .catch((smsError) => {
            console.error(
              '[SMS] Failed to send booking confirmation SMS:',
              smsError
            );
          });
      }
    } catch (error) {
      console.error('[Email] Failed to send booking confirmation:', error);
      // Don't throw - this is already async and shouldn't affect payment
    }
  }

  /**
   * Fetch user details from user service via TCP with retry logic
   * Implements exponential backoff and handles retryable errors
   * @throws Error if all retry attempts fail or error is not retryable
   */
  private async getUserDetail(userId: string): Promise<UserDetailDto> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetryAttempts; attempt++) {
      try {
        return await firstValueFrom(
          this.userClient
            .send<UserDetailDto>(UserMessage.GET_USER_DETAIL, userId)
            .pipe(timeout(this.getUserDetailTimeoutMs))
        );
      } catch (error) {
        lastError = error;

        if (
          !this.isRetryableError(error) ||
          attempt === this.maxRetryAttempts
        ) {
          throw error;
        }

        this.logger.warn(
          `Retrying user detail call. attempt=${attempt + 1}/${
            this.maxRetryAttempts
          } userId=${userId}`
        );

        await this.sleep(this.retryBackoffMs[attempt - 1]);
      }
    }

    throw lastError;
  }

  /**
   * Determine if error is retryable (network errors, timeouts, 5xx)
   * 4xx errors are not retried
   */
  private isRetryableError(error: unknown): boolean {
    const errorAsRecord = error as Record<string, unknown>;
    const code =
      typeof errorAsRecord?.code === 'string' ? errorAsRecord.code : '';

    if (
      code === 'ECONNRESET' ||
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT'
    ) {
      return true;
    }

    if ((error as { name?: string })?.name === 'TimeoutError') {
      return true;
    }

    const statusCode = this.extractStatusCode(errorAsRecord);
    if (statusCode === undefined) {
      return false;
    }

    // Don't retry 4xx errors (client errors)
    if (statusCode >= 400 && statusCode < 500) {
      return false;
    }

    // Retry 5xx errors (server errors)
    return statusCode >= 500;
  }

  /**
   * Extract HTTP status code from error object
   * Handles various error formats from different sources
   */
  private extractStatusCode(
    error: Record<string, unknown>
  ): number | undefined {
    const directStatus = error.status;
    if (typeof directStatus === 'number') {
      return directStatus;
    }

    const response = error.response as Record<string, unknown> | undefined;
    if (!response) {
      return undefined;
    }

    const responseStatus = response.status;
    if (typeof responseStatus === 'number') {
      return responseStatus;
    }

    const statusCode = response.statusCode;
    if (typeof statusCode === 'number') {
      return statusCode;
    }

    return undefined;
  }

  /**
   * Sleep utility for exponential backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
