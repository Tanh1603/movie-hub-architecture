import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentMethod,
  PaymentStatus,
  BookingStatus,
  TicketStatus,
  ServiceResult,
} from '@movie-hub/shared-types';
import * as crypto from 'crypto';
import * as moment from 'moment';
import * as querystring from 'qs';
import { IPaymentStrategy } from '../payment.strategy';
import { PrismaService } from '../../../prisma.service';
import { BookingEventService } from '../../../redis/booking-event.service';

/**
 * VNPay Payment Strategy Implementation
 * Encapsulates all VNPay-specific logic:
 * - Payment URL generation with signature
 * - IPN callback verification
 * - VNPay parameter handling
 * - Checksum validation
 */
@Injectable()
export class VNPayStrategy implements IPaymentStrategy {
  private readonly logger = new Logger(VNPayStrategy.name);

  private vnp_TmnCode: string;
  private vnp_HashSecret: string;
  private vnp_Url: string;
  private vnp_Api: string;
  private vnp_ReturnUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private bookingEventService: BookingEventService
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

  getSupportedMethod(): PaymentMethod {
    return PaymentMethod.VNPAY;
  }

  async createPaymentUrl(
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

  async handlePaymentCallback(
    vnpParams: Record<string, string>
  ): Promise<ServiceResult<{ RspCode: string; Message: string }>> {
    console.log('[VNPay IPN] Received params:', JSON.stringify(vnpParams));
    try {
      const secureHash = vnpParams.vnp_SecureHash;
      const orderId = vnpParams.vnp_TxnRef;
      const transactionId = vnpParams.vnp_TransactionNo;
      const transactionStatus = vnpParams.vnp_TransactionStatus;

      // Clone params to avoid mutating input passed by ref
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

      if (
        payment.booking.expires_at &&
        new Date() > payment.booking.expires_at
      ) {
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

  async handlePaymentReturn(
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

  /**
   * Sort object keys and values for VNPay signature
   * VNPay requires specific encoding and sorting for checksum validation
   */
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
}
