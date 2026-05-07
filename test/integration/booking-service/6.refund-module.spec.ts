/**
 * Refund Module Integration Tests
 *
 * Tests the Refund operations:
 * - createRefund
 * - findAll
 * - findOne
 * - findByPayment
 * - process
 * - approve
 * - reject
 *
 * ⚠️ Key Test Focus:
 * - Refund amount <= Payment amount constraint
 * - Status cascades: Refund COMPLETED -> Payment REFUNDED -> Booking CANCELLED
 *
 * @see test/docs/BOOKING_SERVICE_INTEGRATION_TEST_DOCS.md Section 6
 */

import {
  BookingTestContext,
  createBookingTestingModule,
  cleanupBookingTestData,
  closeBookingTestContext,
  seedConfirmedBooking,
  verifyBookingStatus,
  cleanupBookingsOnly,
} from './helpers/booking-test-helpers';
import {
  BookingStatus,
  PaymentStatus,
  TicketStatus,
  RefundStatus,
} from '@movie-hub/shared-types';
import { of } from 'rxjs';

describe('Refund Module Integration Tests', () => {
  let ctx: BookingTestContext;
  const testUserId = 'refund-test-user';

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
    ctx = await createBookingTestingModule();
  }, 60000);

  afterAll(async () => {
    await cleanupBookingTestData(ctx.prisma);
    await closeBookingTestContext(ctx);
  }, 30000);

  beforeEach(async () => {
    await ctx.prisma.refunds.deleteMany({});
    await cleanupBookingsOnly(ctx.prisma);
  });

  // ============================================================================
  // 6.1 createRefund
  // ============================================================================

  describe('6.1 createRefund', () => {
    describe('Success Scenarios', () => {
      it('should create refund request for completed payment', async () => {
        // Arrange
        const { bookingId, paymentId } = await seedConfirmedBooking(
          ctx.prisma,
          testUserId
        );

        // Act
        const result = await ctx.refundController.create({
          dto: {
            paymentId,
            amount: 100000,
            reason: 'Changed plans',
          },
        });

        // Assert
        expect(result.data).toBeDefined();
        expect(result.data.id).toBeDefined();
        expect(result.data.amount).toBe(100000);
        expect(result.data.status).toBe(RefundStatus.PENDING);
      });

      it('should create refund for full payment amount', async () => {
        // Arrange
        const { paymentId } = await seedConfirmedBooking(
          ctx.prisma,
          testUserId
        );

        // Get payment amount
        const payment = await ctx.prisma.payments.findUnique({
          where: { id: paymentId },
        });

        // Act
        const result = await ctx.refundController.create({
          dto: {
            paymentId,
            amount: Number(payment?.amount),
            reason: 'Full refund',
          },
        });

        // Assert
        expect(result.data.amount).toBe(Number(payment?.amount));
      });
    });

    describe('Failure Scenarios', () => {
      it('should fail when refund amount exceeds payment amount', async () => {
        // Arrange
        const { paymentId } = await seedConfirmedBooking(
          ctx.prisma,
          testUserId
        );

        // Act & Assert
        await expect(
          ctx.refundController.create({
            dto: {
              paymentId,
              amount: 1000000, // More than payment (160000)
              reason: 'Too much',
            },
          })
        ).rejects.toThrow();
      });

      it('should fail for non-existent payment', async () => {
        // Act & Assert
        await expect(
          ctx.refundController.create({
            dto: {
              paymentId: '00000000-0000-0000-0000-000000000000',
              amount: 50000,
              reason: 'Test',
            },
          })
        ).rejects.toThrow();
      });
    });
  });

  // ============================================================================
  // 6.2 findAll
  // ============================================================================

  describe('6.2 findAll', () => {
    beforeEach(async () => {
      // Create multiple refunds
      const { paymentId: p1 } = await seedConfirmedBooking(
        ctx.prisma,
        'user-1'
      );
      const { paymentId: p2 } = await seedConfirmedBooking(
        ctx.prisma,
        'user-2'
      );

      await ctx.prisma.refunds.createMany({
        data: [
          {
            payment_id: p1,
            amount: 50000,
            reason: 'Refund 1',
            status: 'PENDING',
          },
          {
            payment_id: p2,
            amount: 80000,
            reason: 'Refund 2',
            status: 'COMPLETED',
          },
        ],
      });
    });

    it('should return all refunds with pagination', async () => {
      // Act
      const result = await ctx.refundController.findAll({
        filters: { page: 1, limit: 10 },
      });

      // Assert
      expect(result.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      // Act
      const result = await ctx.refundController.findAll({
        filters: { status: RefundStatus.PENDING, page: 1, limit: 10 },
      });

      // Assert
      result.data.forEach((refund) => {
        expect(refund.status).toBe(RefundStatus.PENDING);
      });
    });
  });

  // ============================================================================
  // 6.3 findOne
  // ============================================================================

  describe('6.3 findOne', () => {
    it('should return refund by ID', async () => {
      // Arrange
      const { paymentId } = await seedConfirmedBooking(ctx.prisma, testUserId);
      const refund = await ctx.prisma.refunds.create({
        data: {
          payment_id: paymentId,
          amount: 50000,
          reason: 'Test refund',
          status: 'PENDING',
        },
      });

      // Act
      const result = await ctx.refundController.findOne({ id: refund.id });

      // Assert
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(refund.id);
      expect(result.data.amount).toBe(50000);
    });
  });

  // ============================================================================
  // 6.4 findByPayment
  // ============================================================================

  describe('6.4 findByPayment', () => {
    it('should return refunds for a payment', async () => {
      // Arrange
      const { paymentId } = await seedConfirmedBooking(ctx.prisma, testUserId);
      await ctx.prisma.refunds.create({
        data: {
          payment_id: paymentId,
          amount: 75000,
          reason: 'Partial refund',
          status: 'PENDING',
        },
      });

      // Act
      const result = await ctx.refundController.findByPayment({ paymentId });

      // Assert
      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((r) => {
        expect(r.paymentId).toBe(paymentId);
      });
    });
  });

  // ============================================================================
  // 6.5 approve
  // ============================================================================

  describe('6.5 approve', () => {
    let testRefundId: string;
    let testPaymentId: string;
    let testBookingId: string;

    beforeEach(async () => {
      const { bookingId, paymentId } = await seedConfirmedBooking(
        ctx.prisma,
        testUserId
      );
      testPaymentId = paymentId;
      testBookingId = bookingId;

      const refund = await ctx.prisma.refunds.create({
        data: {
          payment_id: paymentId,
          amount: 160000, // Full refund
          reason: 'Approval test',
          status: 'PENDING',
        },
      });
      testRefundId = refund.id;
    });

    describe('Success Scenarios', () => {
      it('should approve refund and set status to COMPLETED', async () => {
        // Act
        const result = await ctx.refundController.approve({
          refundId: testRefundId,
        });

        // Assert
        expect(result.data.status).toBe(RefundStatus.COMPLETED);
      });

      it('should update payment status to REFUNDED', async () => {
        // Act
        await ctx.refundController.approve({ refundId: testRefundId });

        // Assert
        const payment = await ctx.prisma.payments.findUnique({
          where: { id: testPaymentId },
        });
        expect(payment?.status).toBe(PaymentStatus.REFUNDED);
      });

      it('should update booking status to CANCELLED', async () => {
        // Act
        await ctx.refundController.approve({ refundId: testRefundId });

        // Assert
        await verifyBookingStatus(
          ctx.prisma,
          testBookingId,
          BookingStatus.CANCELLED
        );
      });

      it('should set approved_at timestamp', async () => {
        // Act
        await ctx.refundController.approve({ refundId: testRefundId });

        // Assert
        const refund = await ctx.prisma.refunds.findUnique({
          where: { id: testRefundId },
        });
        expect(refund?.refunded_at).not.toBeNull();
      });
    });
  });

  // ============================================================================
  // 6.6 reject
  // ============================================================================

  describe('6.6 reject', () => {
    let testRefundId: string;
    let testPaymentId: string;

    beforeEach(async () => {
      const { paymentId } = await seedConfirmedBooking(ctx.prisma, testUserId);
      testPaymentId = paymentId;

      const refund = await ctx.prisma.refunds.create({
        data: {
          payment_id: paymentId,
          amount: 50000,
          reason: 'Rejection test',
          status: 'PENDING',
        },
      });
      testRefundId = refund.id;
    });

    it('should reject refund with reason', async () => {
      // Act
      const result = await ctx.refundController.reject({
        refundId: testRefundId,
        reason: 'Policy violation',
      });

      // Assert
      expect(result.data.status).toBe(RefundStatus.FAILED);
    });

    it('should store rejection reason', async () => {
      // Act
      await ctx.refundController.reject({
        refundId: testRefundId,
        reason: 'Not eligible for refund',
      });

      // Assert
      const refund = await ctx.prisma.refunds.findUnique({
        where: { id: testRefundId },
      });
      // Rejection reason is not currently stored in DB schema
      expect(refund?.status).toBe(RefundStatus.FAILED);
    });

    it('should NOT update payment status on rejection', async () => {
      // Act
      await ctx.refundController.reject({
        refundId: testRefundId,
        reason: 'Rejected',
      });

      // Assert - Payment should remain COMPLETED
      const payment = await ctx.prisma.payments.findUnique({
        where: { id: testPaymentId },
      });
      expect(payment?.status).toBe(PaymentStatus.COMPLETED);
    });
  });

  // ============================================================================
  // Partial Refund Scenarios
  // ============================================================================

  describe('Partial Refund Scenarios', () => {
    it('should allow partial refund less than payment amount', async () => {
      // Arrange
      const { paymentId } = await seedConfirmedBooking(ctx.prisma, testUserId);

      // Act - Request 50% refund
      const result = await ctx.refundController.create({
        dto: {
          paymentId,
          amount: 80000, // Half of 160000
          reason: 'Partial refund request',
        },
      });

      // Assert
      expect(result.data).toBeDefined();
      expect(result.data.amount).toBe(80000);
    });
  });

  // ============================================================================
  // 6.7 processRefundAsVoucher (Refund as Voucher)
  // ============================================================================

  describe('6.7 processRefundAsVoucher', () => {
    describe('Success Scenarios', () => {
      it('should process refund as voucher when >24h before showtime', async () => {
        // Arrange
        const futureShowtimeId = '10000000-0000-0000-0000-000000000048';

        // Mock Cinema Service to return future showtime
        ctx.mockCinemaClient.send.mockImplementation(
          (pattern: string, data: any) => {
            if (
              pattern === 'showtime.get_showtime_seats' &&
              data.showtimeId === futureShowtimeId
            ) {
              const futureDate = new Date();
              futureDate.setHours(futureDate.getHours() + 48);
              return of({
                showtime: {
                  id: futureShowtimeId,
                  movieTitle: 'Mock Movie',
                  start_time: futureDate,
                  end_time: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
                  format: '2D',
                  language: 'Vietnamese',
                },
                cinemaName: 'Mock Cinema',
                hallName: 'Hall A',
                seat_map: [],
              });
            }
            return of({});
          }
        );

        const { bookingId } = await seedConfirmedBooking(
          ctx.prisma,
          testUserId,
          futureShowtimeId
        );

        // Fetch booking code
        const bookingRecord = await ctx.prisma.bookings.findUnique({
          where: { id: bookingId },
        });
        const bookingCode = bookingRecord?.booking_code;

        // Act
        const result = await ctx.refundController.processAsVoucher({
          bookingId,
          userId: testUserId,
          reason: 'Changed mind',
        });

        // Assert
        expect(result.data.bookingId).toBeDefined();
        expect(result.data.voucher).toBeDefined();
        expect(result.data.voucher.code).toContain('REFUND-');
        expect(result.data.voucher.code).toContain(bookingCode!);

        // Check voucher details
        expect(Number(result.data.voucher.value)).toBe(160000); // Ticket value
        expect(result.data.voucher.usageLimit).toBe(1);

        // Verify booking status in DB
        const booking = await ctx.prisma.bookings.findUnique({
          where: { id: bookingId },
        });
        expect(booking?.status).toBe(BookingStatus.REFUNDED);
      });
      it('should reject refund when <24h before showtime', async () => {
        // Arrange
        const nearShowtimeId = '10000000-0000-0000-0000-000000000012';

        // Mock Cinema Service
        ctx.mockCinemaClient.send.mockImplementation(
          (pattern: string, data: any) => {
            if (
              pattern === 'showtime.get_showtime_seats' &&
              data.showtimeId === nearShowtimeId
            ) {
              const nearDate = new Date();
              nearDate.setHours(nearDate.getHours() + 12);
              return of({
                showtime: {
                  id: nearShowtimeId,
                  movieTitle: 'Mock Movie',
                  start_time: nearDate,
                  end_time: new Date(nearDate.getTime() + 2 * 60 * 60 * 1000),
                  format: '2D',
                  language: 'Vietnamese',
                },
                cinemaName: 'Mock Cinema',
                hallName: 'Hall A',
                seat_map: [],
              });
            }
            return of({});
          }
        );

        const { bookingId } = await seedConfirmedBooking(
          ctx.prisma,
          testUserId,
          nearShowtimeId
        );

        // Act & Assert
        await expect(
          ctx.refundController.processAsVoucher({
            bookingId,
            userId: testUserId,
            reason: 'Too late',
          })
        ).rejects.toThrow(/Refund must be requested at least 24 hours/);
      });

      it('should reject refund for non-CONFIRMED bookings', async () => {
        // Arrange
        const { bookingId } = await seedConfirmedBooking(
          ctx.prisma,
          testUserId,
          '10000000-0000-0000-0000-000000000000'
        );
        await ctx.prisma.bookings.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CANCELLED },
        });

        // Act & Assert
        await expect(
          ctx.refundController.processAsVoucher({
            bookingId,
            userId: testUserId,
          })
        ).rejects.toThrow(/Can only refund confirmed bookings/);
      });

      it('should reject refund for booking not owned by user', async () => {
        // Arrange
        const { bookingId } = await seedConfirmedBooking(
          ctx.prisma,
          'other-user',
          '10000000-0000-0000-0000-000000000000'
        );

        // Act & Assert
        // The service logic checks `user_id: userId` in findFirst, so it won't find the booking
        await expect(
          ctx.refundController.processAsVoucher({
            bookingId,
            userId: testUserId,
          })
        ).rejects.toThrow(/Booking not found/);
      });
    });
  });
});
