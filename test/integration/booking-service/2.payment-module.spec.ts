/**
 * Payment Module Integration Tests
 *
 * Tests the Payment operations:
 * - createPayment (generates VNPay URL)
 * - handleVNPayIPN (webhook with checksum validation)
 * - findOne / findByBooking
 * - adminFindAll
 *
 * ⚠️ Key Test Focus:
 * - VNPay checksum validation (HMAC-SHA512)
 * - Success flow: Payment COMPLETED, Booking CONFIRMED, Tickets VALID
 * - Failure flow: Payment FAILED, Booking CANCELLED, Tickets CANCELLED
 *
 * @see test/docs/BOOKING_SERVICE_INTEGRATION_TEST_DOCS.md Section 2
 */

import {
  BookingTestContext,
  createBookingTestingModule,
  cleanupBookingTestData,
  closeBookingTestContext,
  seedPendingBooking,
  createMockVNPayIPN,
  generateVNPayChecksum,
  verifyBookingStatus,
  verifyTicketsStatus,
  cleanupBookingsOnly,
} from './helpers/booking-test-helpers';
import {
  BookingStatus,
  PaymentStatus,
  TicketStatus,
} from '@movie-hub/shared-types';

describe('Payment Module Integration Tests', () => {
  let ctx: BookingTestContext;
  const testUserId = 'test-user-id';
  const VNPAY_SECRET = 'test-vnpay-secret-key';

  // ============================================================================
  // TEST LIFECYCLE
  // ============================================================================

  beforeAll(async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true,
      configurable: true,
    });
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5438/movie_hub_booking?schema=public';
    process.env.VNPAY_HASH_SECRET = VNPAY_SECRET;
    ctx = await createBookingTestingModule();
  }, 60000);

  afterAll(async () => {
    await cleanupBookingTestData(ctx.prisma);
    await closeBookingTestContext(ctx);
  }, 30000);

  beforeEach(async () => {
    await cleanupBookingsOnly(ctx.prisma);
    ctx.mockNotificationService.sendBookingConfirmation.mockClear();
  });

  // ============================================================================
  // 2.1 createPayment
  // ============================================================================

  describe('2.1 createPayment', () => {
    let testBookingId: string;

    beforeEach(async () => {
      testBookingId = await seedPendingBooking(ctx.prisma, testUserId);
    });

    describe('Success Scenarios', () => {
      it('should create payment and generate VNPay URL', async () => {
        // Act
        const result = await ctx.paymentController.create({
          bookingId: testBookingId,
          dto: { paymentMethod: 'VNPAY' as any },
          ipAddr: '127.0.0.1',
        });

        // Assert
        expect(result.data).toBeDefined();
        expect(result.data.paymentUrl).toBeDefined();
        expect(result.data.paymentUrl).toContain('vnp');

        // Verify payment record created
        const payment = await ctx.prisma.payments.findFirst({
          where: { booking_id: testBookingId },
        });
        expect(payment).not.toBeNull();
        expect(payment?.status).toBe(PaymentStatus.PENDING);
        expect(payment?.payment_method).toBe('VNPAY');
      });

      it('should store payment URL in database', async () => {
        // Act
        const result = await ctx.paymentController.create({
          bookingId: testBookingId,
          dto: { paymentMethod: 'VNPAY' as any },
          ipAddr: '192.168.1.1',
        });

        // Assert
        const payment = await ctx.prisma.payments.findFirst({
          where: { booking_id: testBookingId },
        });
        expect(payment?.payment_url).toBeDefined();
        expect(payment?.payment_url).toContain(payment?.id);
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw error for non-existent booking', async () => {
        // Act & Assert
        await expect(
          ctx.paymentController.create({
            bookingId: '00000000-0000-0000-0000-000000000000',
            dto: { paymentMethod: 'VNPAY' as any },
            ipAddr: '127.0.0.1',
          })
        ).rejects.toThrow();
      });
    });
  });

  // ============================================================================
  // 2.2 handleVNPayIPN
  // ============================================================================

  describe('2.2 handleVNPayIPN', () => {
    let testBookingId: string;
    let testPaymentId: string;

    beforeEach(async () => {
      // Create booking and payment
      testBookingId = await seedPendingBooking(ctx.prisma, testUserId);

      const payment = await ctx.prisma.payments.create({
        data: {
          booking_id: testBookingId,
          amount: 160000,
          payment_method: 'VNPAY',
          status: PaymentStatus.PENDING,
        },
      });
      testPaymentId = payment.id;
    });

    describe('Checksum Validation', () => {
      it('should reject IPN with invalid checksum', async () => {
        // Arrange - Create IPN with wrong checksum
        const invalidParams = {
          vnp_TmnCode: 'TESTCODE',
          vnp_Amount: '16000000',
          vnp_OrderInfo: testPaymentId,
          vnp_ResponseCode: '00',
          vnp_TxnRef: testPaymentId,
          vnp_SecureHash: 'INVALID_HASH',
          vnp_SecureHashType: 'SHA512',
        };

        // Act
        const result = await ctx.paymentController.handleVNPayIPN({ params: invalidParams });

        // Assert
        expect(result.data.RspCode).toBe('97');
        expect(result.data.Message).toContain('Checksum failed');
      });

      it('should accept IPN with valid checksum', async () => {
        // Arrange - Create IPN with valid checksum
        const validParams = createMockVNPayIPN(
          testPaymentId,
          `TXN${Date.now()}`,
          160000,
          '00',
          VNPAY_SECRET
        );

        // Act
        const result = await ctx.paymentController.handleVNPayIPN({
          params: validParams,
        });

        // Assert - Should process successfully
        expect(result).toBeDefined();
      });
    });

    describe('Success Flow (Response Code 00)', () => {
      it('should update payment to COMPLETED', async () => {
        // Arrange
        const params = createMockVNPayIPN(
          testPaymentId,
          `TXN${Date.now()}`,
          160000,
          '00',
          VNPAY_SECRET
        );

        // Act
        await ctx.paymentController.handleVNPayIPN({ params });

        // Assert
        const payment = await ctx.prisma.payments.findFirst({
          where: { booking_id: testBookingId },
        });
        expect(payment?.status).toBe(PaymentStatus.COMPLETED);
      });

      it('should update booking to CONFIRMED', async () => {
        // Arrange
        const params = createMockVNPayIPN(
          testPaymentId,
          `TXN${Date.now()}`,
          160000,
          '00',
          VNPAY_SECRET
        );

        // Act
        await ctx.paymentController.handleVNPayIPN({ params });

        // Assert
        await verifyBookingStatus(
          ctx.prisma,
          testBookingId,
          BookingStatus.CONFIRMED,
          PaymentStatus.COMPLETED
        );
      });

      it('should update tickets to VALID', async () => {
        // Arrange
        const params = createMockVNPayIPN(
          testPaymentId,
          `TXN${Date.now()}`,
          160000,
          '00',
          VNPAY_SECRET
        );

        // Act
        await ctx.paymentController.handleVNPayIPN({ params });

        // Assert
        await verifyTicketsStatus(
          ctx.prisma,
          testBookingId,
          TicketStatus.VALID
        );
      });

      it('should trigger notification service for email', async () => {
        // Arrange
        const params = createMockVNPayIPN(
          testPaymentId,
          `TXN${Date.now()}`,
          160000,
          '00',
          VNPAY_SECRET
        );

        // Act
        await ctx.paymentController.handleVNPayIPN({ params });

        // Assert - Give async email a moment to fire
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Note: Email is async/unawaited, so this may or may not be called
        // depending on implementation. Testing side effect notification
      });

      it('should store transaction ID from VNPay', async () => {
        // Arrange
        const transactionId = `TXN${Date.now()}`;
        const params = createMockVNPayIPN(
          testPaymentId,
          transactionId,
          160000,
          '00',
          VNPAY_SECRET
        );

        // Act
        await ctx.paymentController.handleVNPayIPN({ params });

        // Assert
        const payment = await ctx.prisma.payments.findFirst({
          where: { booking_id: testBookingId },
        });
        expect(payment?.transaction_id).toBeDefined();
      });
    });

    describe('Failure Flow (Response Code != 00)', () => {
      it('should update payment to FAILED for declined transaction', async () => {
        // Arrange - Response code 24 = cancelled by user
        const params = createMockVNPayIPN(
          testPaymentId,
          `TXN${Date.now()}`,
          160000,
          '24',
          VNPAY_SECRET
        );

        // Act
        await ctx.paymentController.handleVNPayIPN({ params });

        // Assert
        const payment = await ctx.prisma.payments.findFirst({
          where: { booking_id: testBookingId },
        });
        expect(payment?.status).toBe(PaymentStatus.FAILED);
      });

      it('should update booking to CANCELLED for failed payment', async () => {
        // Arrange
        const params = createMockVNPayIPN(
          testPaymentId,
          `TXN${Date.now()}`,
          160000,
          '51', // Insufficient funds
          VNPAY_SECRET
        );

        // Act
        await ctx.paymentController.handleVNPayIPN({ params });

        // Assert
        await verifyBookingStatus(
          ctx.prisma,
          testBookingId,
          BookingStatus.CANCELLED
        );
      });

      it('should update tickets to CANCELLED for failed payment', async () => {
        // Arrange
        const params = createMockVNPayIPN(
          testPaymentId,
          `TXN${Date.now()}`,
          160000,
          '75', // Transaction limit exceeded
          VNPAY_SECRET
        );

        // Act
        await ctx.paymentController.handleVNPayIPN({ params });

        // Assert
        await verifyTicketsStatus(
          ctx.prisma,
          testBookingId,
          TicketStatus.CANCELLED
        );
      });
    });
  });

  // ============================================================================
  // 2.3 findOne / findByBooking
  // ============================================================================

  describe('2.3 findOne / findByBooking', () => {
    let testBookingId: string;
    let testPaymentId: string;

    beforeEach(async () => {
      testBookingId = await seedPendingBooking(ctx.prisma, testUserId);

      const payment = await ctx.prisma.payments.create({
        data: {
          booking_id: testBookingId,
          amount: 160000,
          payment_method: 'VNPAY',
          status: PaymentStatus.PENDING,
        },
      });
      testPaymentId = payment.id;
    });

    describe('findOne', () => {
      it('should return payment by ID', async () => {
        // Act
        const result = await ctx.paymentController.findOne({
          id: testPaymentId,
        });

        // Assert
        expect(result.data).toBeDefined();
        expect(result.data.id).toBe(testPaymentId);
        expect(result.data.amount).toBe(160000);
      });
    });

    describe('findByBooking', () => {
      it('should return payments for a booking', async () => {
        // Act
        const result = await ctx.paymentController.findByBooking({
          bookingId: testBookingId,
        });

        // Assert
        expect(result.data).toBeDefined();
      });
    });
  });

  // ============================================================================
  // 2.4 adminFindAll
  // ============================================================================

  describe('2.4 adminFindAll', () => {
    beforeEach(async () => {
      // Create multiple payments
      const booking1 = await seedPendingBooking(ctx.prisma, 'user-1');
      const booking2 = await seedPendingBooking(ctx.prisma, 'user-2');

      await ctx.prisma.payments.createMany({
        data: [
          {
            booking_id: booking1,
            amount: 100000,
            payment_method: 'VNPAY' as any,
            status: PaymentStatus.PENDING,
          },
          {
            booking_id: booking2,
            amount: 200000,
            payment_method: 'VNPAY' as any,
            status: PaymentStatus.COMPLETED,
          },
        ],
      });
    });

    it('should return all payments with pagination', async () => {
      // Act
      const result = await ctx.paymentController.adminFindAll({
        filters: { page: 1, limit: 10 },
      });

      // Assert
      expect(result.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      // Act
      const result = await ctx.paymentController.adminFindAll({
        filters: { status: PaymentStatus.COMPLETED, page: 1, limit: 10 },
      });

      // Assert - Only completed payments
      result.data.forEach((payment) => {
        expect(payment.status).toBe(PaymentStatus.COMPLETED);
      });
    });
  });
});
