import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
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
  UserMessage,
  UserDetailDto,
  SERVICE_NAME,
} from '@movie-hub/shared-types';
import * as crypto from 'crypto';
import * as moment from 'moment';
import * as querystring from 'qs';
import { BookingEventService } from '../redis/booking-event.service';

@Injectable()
export class PaymentService {
  private vnp_TmnCode: string;
  private vnp_HashSecret: string;
  private vnp_Url: string;
  private vnp_Api: string;
  private vnp_ReturnUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private bookingEventService: BookingEventService,
    @Inject(SERVICE_NAME.USER) private userClient: ClientProxy,
    private notificationService: NotificationService,
    private ticketService: TicketService
  ) {
    this.vnp_TmnCode = this.configService.get('VNPAY_TMN_CODE') || 'EX6ATLAM';
    this.vnp_HashSecret =
      this.configService.get('VNPAY_HASH_SECRET') ||
      'ID4MX46WVEFNI39KLW9JUFHDR0I4U3IB';
    this.vnp_Url =
      this.configService.get('VNPAY_URL') ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.vnp_Api =
      this.configService.get('VNPAY_API') ||
      'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';
    this.vnp_ReturnUrl =
      this.configService.get('VNPAY_RETURN_URL') ||
      'http://localhost:3000/payment/return';
  }

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
        payment_method: dto.paymentMethod,
        status: PaymentStatus.PENDING,
        metadata: {
          returnUrl: dto.returnUrl,
          cancelUrl: dto.cancelUrl,
        },
      },
    });

    // Use the validated paymentAmount instead of dto.amount
    const paymentUrl = await this.createVNPayUrl(
      payment.id,
      booking.id,
      booking.expires_at,
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
          payment_method: dto.paymentMethod,
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

  async createVNPayUrl(
    paymentId: string,
    bookingId: string,
    expireAt: Date,
    amount: number,
    ipAddr: string
  ): Promise<string> {
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid payment amount for VNPay URL generation');
    }

    // Use moment with timezone awareness - ensure all dates use Asia/Ho_Chi_Minh

    const createDate = moment
      .utc()
      .utcOffset('+07:00')
      .format('YYYYMMDDHHmmss');

    // Convert expireAt to Vietnam timezone (UTC+7) and format
    const expireDate = moment
      .utc(expireAt)
      .utcOffset('+07:00')
      .format('YYYYMMDDHHmmss');

    const orderId = paymentId;
    const locale = 'vn';
    const currCode = 'VND';

    // Clean IP address (remove ::ffff: prefix if present)
    const cleanIpAddr = ipAddr.replace(/^.*:/, '');

    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: currCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan cho ma GD:${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // Must multiply by 100 (remove decimal part)
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_IpAddr: cleanIpAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Convert all parameters to strings first, then sort
    const stringParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(vnp_Params)) {
      stringParams[key] = String(value);
    }

    // Sort string parameters before creating signature
    const sortedParams = this.sortObject(stringParams);

    // Create signature using HMAC SHA512
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    sortedParams.vnp_SecureHash = signed;

    console.log('[VNPay Create] signData:', signData);
    console.log('[VNPay Create] signed:', signed);

    const paymentUrl =
      this.vnp_Url +
      '?' +
      querystring.stringify(sortedParams, { encode: false });

    return paymentUrl;
  }

  async handleVNPayIPN(
    vnpParams: Record<string, string>
  ): Promise<ServiceResult<{ RspCode: string; Message: string }>> {
    console.log('[VNPay IPN] Received params:', JSON.stringify(vnpParams));
    try {
      const secureHash = vnpParams.vnp_SecureHash;
      const orderId = vnpParams.vnp_TxnRef;
      const transactionId = vnpParams.vnp_TransactionNo;
      const transactionStatus = vnpParams.vnp_TransactionStatus;

      // Clone params to avoid mutating input passed by ref (though usually safe)
      const paramsToVerify = { ...vnpParams };
      delete paramsToVerify.vnp_SecureHash;
      delete paramsToVerify.vnp_SecureHashType;

      const sortedParams = this.sortObject(paramsToVerify);
      const signData = querystring.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      console.log('[VNPay IPN] signData:', signData);
      console.log('[VNPay IPN] computed:', signed);
      console.log('[VNPay IPN] provided:', secureHash);

      if (secureHash?.toUpperCase() !== signed?.toUpperCase()) {
        console.error('[VNPay IPN] Checksum failed');
        return { data: { RspCode: '97', Message: 'Checksum failed' } };
      }

      console.log(`[VNPay IPN] Finding payment for orderId: ${orderId}`);
      const payment = await this.prisma.payments.findUnique({
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
            },
          },
        },
      });

      if (!payment) {
        console.error('[VNPay IPN] Order not found');
        return { data: { RspCode: '01', Message: 'Order not found' } };
      }

      console.log('[VNPay IPN] Payment found:', payment.id);

      // Check expiry (optional, depends on business logic, usually IPN should still process if user paid on time)
      // VNPAY timestamp is vnp_PayDate, but we can check if payment was created too long ago?
      // For now, keep existing logic but be careful.
      if (
        payment.booking.expires_at &&
        new Date() > payment.booking.expires_at
      ) {
        // If checks fail, we might still want to record the payment as FAILED or handle manual refund?
        // But preventing updates on expired booking is standard.
        console.error('[VNPay IPN] Order expired');
        return { data: { RspCode: '04', Message: 'Order expired' } };
      }

      const amount = parseInt(vnpParams.vnp_Amount) / 100;
      if (Number(payment.amount) !== amount) {
        console.error(
          `[VNPay IPN] Invalid amount. Expected ${payment.amount}, got ${amount}`
        );
        return { data: { RspCode: '04', Message: 'Amount invalid' } };
      }

      if (
        payment.status !== PaymentStatus.PENDING ||
        payment.booking.status !== BookingStatus.PENDING
      ) {
        console.log('[VNPay IPN] Order already processed');
        return {
          data: {
            RspCode: '02',
            Message: 'This order has been updated to the payment status',
          },
        };
      }

      console.log(
        `[VNPay IPN] Processing transaction status: ${transactionStatus}`
      );

      if (transactionStatus === '00') {
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
            console.log(
              `[VNPay IPN] Incrementing usage for promotion: ${bookingWithPromotion.promotion_code}`
            );
          }
        });

        console.log('[VNPay IPN] DB updated successfully');

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
          console.log('[VNPay IPN] Event published');
        } catch (eventError) {
          console.error('[VNPay IPN] Event publish warning:', eventError);
          // Non-critical
        }

        // Send booking confirmation email ASYNCHRONOUSLY
        this.sendBookingConfirmationEmailAsync(payment.booking_id).catch(
          (emailError) => {
            console.error(
              '[Payment] Failed to send booking confirmation email (async):',
              emailError
            );
          }
        );

        return { data: { RspCode: '00', Message: 'Success' } };
      } else {
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

        return { data: { RspCode: '00', Message: 'Success' } };
      }
    } catch (error) {
      console.error('[VNPay IPN] Critical Error:', error);
      // Return 99 (Unspecified error) but include message for debugging
      // VNPay expects RspCode 99 for errors.
      return {
        data: {
          RspCode: '99',
          Message: `Update failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      };
    }
  }
  //  //## DONT USE THIS , use ipn instead
  async handleVNPayReturn(
    vnpParams: Record<string, string>
  ): Promise<ServiceResult<{ status: string; code: string }>> {
    const secureHash = vnpParams.vnp_SecureHash;

    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    const sortedParams = this.sortObject(vnpParams);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash?.toUpperCase() === signed?.toUpperCase()) {
      return { data: { status: 'success', code: vnpParams.vnp_ResponseCode } };
    } else {
      return { data: { status: 'error', code: '97' } };
    }
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

  private sortObject(obj: Record<string, string>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys: string[] = [];

    // Get all keys and encode them for sorting
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        keys.push(encodeURIComponent(key));
      }
    }

    // Sort encoded keys alphabetically
    keys.sort();

    // Build sorted object with encoded keys and encoded values
    for (const encodedKey of keys) {
      // Find original key by decoding
      const originalKey = Object.keys(obj).find(
        (k) => encodeURIComponent(k) === encodedKey
      );
      if (originalKey) {
        sorted[encodedKey] = encodeURIComponent(obj[originalKey]).replace(
          /%20/g,
          '+'
        );
      }
    }

    return sorted;
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
        userDetails = await firstValueFrom(
          this.userClient.send<UserDetailDto>(
            UserMessage.GET_USER_DETAIL,
            fullBooking.user_id
          )
        );
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
      const bookingForEmail = {
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
        promotionCode: fullBooking.promotion_code,
        status: fullBooking.status as BookingStatus,
        paymentStatus: fullBooking.payment_status as PaymentStatus,
        expiresAt: fullBooking.expires_at,
        cancelledAt: fullBooking.cancelled_at,
        cancellationReason: fullBooking.cancellation_reason,
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
}
