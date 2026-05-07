/**
 * Booking Module Integration Tests
 *
 * Tests the Booking operations:
 * - createBooking
 * - findAll (user bookings)
 * - findOne
 * - getSummary
 * - cancelBooking
 * - adminFindAll
 *
 * @see test/docs/BOOKING_SERVICE_INTEGRATION_TEST_DOCS.md Section 1
 */

import {
  BookingTestContext,
  createBookingTestingModule,
  cleanupBookingTestData,
  closeBookingTestContext,
  createTestBookingRequest,
  seedPendingBooking,
  seedConfirmedBooking,
  verifyBookingStatus,
  cleanupBookingsOnly,
} from './helpers/booking-test-helpers';
import { BookingStatus, PaymentStatus } from '@movie-hub/shared-types';

describe('Booking Module Integration Tests', () => {
  let ctx: BookingTestContext;
  const testUserId = 'test-user-id';

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
    await cleanupBookingsOnly(ctx.prisma);
    // Clear mocks
    ctx.mockCinemaClient.send.mockClear();
    ctx.mockUserClient.send.mockClear();
    ctx.mockNotificationService.sendBookingConfirmation.mockClear();
  });

  // ============================================================================
  // 1.1 createBooking
  // ============================================================================

  describe('1.1 createBooking', () => {
    describe('Success Scenarios', () => {
      it('should create a pending booking with 15-minute TTL', async () => {
        // Arrange
        const showtimeId = '123e4567-e89b-12d3-a456-426614174000';
        const dto = createTestBookingRequest(showtimeId);

        // Act
        const result = await ctx.bookingController.create({
          userId: testUserId,
          dto,
        });

        // Assert - Response
        expect(result.data).toBeDefined();
        expect(result.data.bookingId).toBeDefined();
        expect(result.data.status).toBe(BookingStatus.PENDING);
        expect(result.data.paymentStatus).toBe(PaymentStatus.PENDING);

        // Assert - ExpiresAt is approximately 15 minutes from now
        const expiresAt = new Date(result.data.expiresAt);
        const expectedExpiry = new Date(Date.now() + 15 * 60 * 1000);
        const timeDiff = Math.abs(
          expiresAt.getTime() - expectedExpiry.getTime()
        );
        expect(timeDiff).toBeLessThan(5000); // Within 5 seconds

        // Assert - Persisted in database
        await verifyBookingStatus(
          ctx.prisma,
          result.data.bookingId,
          BookingStatus.PENDING,
          PaymentStatus.PENDING
        );
      });

      it('should return existing pending booking if user already has one for same showtime', async () => {
        // Arrange - Create initial booking
        const showtimeId = '10000000-0000-0000-0000-000000000000';
        const dto = createTestBookingRequest(showtimeId);

        const firstResult = await ctx.bookingController.create({
          userId: testUserId,
          dto,
        });

        // Act - Try to create another booking for same showtime
        const secondResult = await ctx.bookingController.create({
          userId: testUserId,
          dto,
        });

        // Assert - Should return same booking
        expect(secondResult.data.bookingId).toBe(firstResult.data.bookingId);
      });

      it('should generate unique booking codes', async () => {
        // Arrange
        const dto1 = createTestBookingRequest('10000000-0000-0000-0000-000000000001');
        const dto2 = createTestBookingRequest('10000000-0000-0000-0000-000000000002');

        // Act
        const result1 = await ctx.bookingController.create({
          userId: testUserId,
          dto: dto1,
        });

        const result2 = await ctx.bookingController.create({
          userId: 'different-user',
          dto: dto2,
        });

        // Assert - Booking codes should be unique
        expect(result1.data.bookingCode).toBeDefined();
        expect(result2.data.bookingCode).toBeDefined();
        expect(result1.data.bookingCode).not.toBe(result2.data.bookingCode);
      });

      it('should initialize booking with zero amounts', async () => {
        // Arrange
        const dto = createTestBookingRequest();

        // Act
        const result = await ctx.bookingController.create({
          userId: testUserId,
          dto,
        });

        // Assert - Initial pricing
        expect(result.data.pricing.subtotal).toBe(0);
        expect(result.data.pricing.totalDiscount).toBe(0);
        expect(result.data.pricing.finalAmount).toBe(0);
      });
    });
  });

  // ============================================================================
  // 1.2 findAll (User Bookings)
  // ============================================================================

  describe('1.2 findAll (User Bookings)', () => {
    beforeEach(async () => {
      // Create multiple bookings for the user
      await seedPendingBooking(ctx.prisma, testUserId, '10000000-0000-0000-0000-000000000001');
      await seedConfirmedBooking(ctx.prisma, testUserId, '10000000-0000-0000-0000-000000000002');
      await seedPendingBooking(ctx.prisma, 'other-user', '10000000-0000-0000-0000-000000000003');
    });

    describe('Success Scenarios', () => {
      it('should return paginated bookings for a user', async () => {
        // Act
        const result = await ctx.bookingController.findAll({
          userId: testUserId,
          query: { page: 1, limit: 10 },
        });

        // Assert
        expect(result.data.length).toBe(2); // Only the test user's bookings
        expect(result.meta).toMatchObject({
          page: 1,
          limit: 10,
          totalRecords: 2,
        });
      });

      it('should filter bookings by status', async () => {
        // Act
        const result = await ctx.bookingController.findAll({
          userId: testUserId,
          query: { status: BookingStatus.PENDING, page: 1, limit: 10 },
        });

        // Assert
        expect(result.data.length).toBe(1);
        expect(result.data[0].status).toBe(BookingStatus.PENDING);
      });

      it('should return empty array for user with no bookings', async () => {
        // Act
        const result = await ctx.bookingController.findAll({
          userId: 'non-existent-user',
          query: { page: 1, limit: 10 },
        });

        // Assert
        expect(result.data).toEqual([]);
        expect(result.meta?.totalRecords).toBe(0);
      });

      it('should sort bookings by created_at descending by default', async () => {
        // Act
        const result = await ctx.bookingController.findAll({
          userId: testUserId,
          query: { page: 1, limit: 10 },
        });

        // Assert - Most recent first
        const dates = result.data.map((b) => new Date(b.createdAt).getTime());
        const sortedDates = [...dates].sort((a, b) => b - a);
        expect(dates).toEqual(sortedDates);
      });
    });
  });

  // ============================================================================
  // 1.3 findOne
  // ============================================================================

  describe('1.3 findOne', () => {
    let testBookingId: string;

    beforeEach(async () => {
      testBookingId = await seedPendingBooking(ctx.prisma, testUserId);
    });

    describe('Success Scenarios', () => {
      it('should return booking details by ID', async () => {
        // Act
        const result = await ctx.bookingController.findOne({
          id: testBookingId,
          userId: testUserId,
        });

        // Assert
        expect(result.data).toBeDefined();
        expect(result.data.id).toBe(testBookingId);
        expect(result.data.userId).toBe(testUserId);
        expect(result.data.seats).toBeDefined();
        expect(result.data.seats.length).toBe(2); // 2 tickets created
      });

      it('should include ticket details', async () => {
        // Act
        const result = await ctx.bookingController.findOne({
          id: testBookingId,
          userId: testUserId,
        });

        // Assert
        expect(result.data.seats.length).toBeGreaterThan(0);
        result.data.seats.forEach((seat) => {
          expect(seat.seatId).toBeDefined();
          expect(seat.price).toBeDefined();
          expect(seat.ticketType).toBeDefined();
        });
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw error for non-existent booking', async () => {
        // Act & Assert
        await expect(
          ctx.bookingController.findOne({
            id: '00000000-0000-0000-0000-000000000000',
            userId: testUserId,
          })
        ).rejects.toThrow('Booking not found');
      });

      it('should throw error when userId does not match booking owner', async () => {
        // Act & Assert - Different user trying to access
        await expect(
          ctx.bookingController.findOne({
            id: testBookingId,
            userId: 'different-user-id',
          })
        ).rejects.toThrow('Booking not found');
      });
    });
  });

  // ============================================================================
  // 1.4 getSummary
  // ============================================================================

  describe('1.4 getSummary', () => {
    let testBookingId: string;

    beforeEach(async () => {
      testBookingId = await seedPendingBooking(ctx.prisma, testUserId);
    });

    describe('Success Scenarios', () => {
      it('should return detailed booking summary with pricing breakdown', async () => {
        // Act
        const result = await ctx.bookingController.getSummary({
          id: testBookingId,
          userId: testUserId,
        });

        // Assert - Structure
        expect(result.data).toBeDefined();
        expect(result.data.bookingId).toBe(testBookingId);
        expect(result.data.movie).toBeDefined();
        expect(result.data.cinema).toBeDefined();
        expect(result.data.showtime).toBeDefined();
        expect(result.data.ticketGroups).toBeDefined();
        expect(result.data.pricing).toBeDefined();
      });

      it('should include pricing breakdown with tax calculation', async () => {
        // Act
        const result = await ctx.bookingController.getSummary({
          id: testBookingId,
          userId: testUserId,
        });

        // Assert - Pricing structure
        const { pricing } = result.data;
        expect(pricing.ticketsSubtotal).toBeDefined();
        expect(pricing.concessionsSubtotal).toBeDefined();
        expect(pricing.subtotal).toBeDefined();
        expect(pricing.tax).toBeDefined();
        expect(pricing.tax.vatRate).toBe(10);
        expect(pricing.finalAmount).toBeDefined();
      });

      it('should group tickets by ticket type', async () => {
        // Act
        const result = await ctx.bookingController.getSummary({
          id: testBookingId,
          userId: testUserId,
        });

        // Assert - Ticket groups
        expect(result.data.ticketGroups).toBeInstanceOf(Array);
        result.data.ticketGroups.forEach((group) => {
          expect(group.ticketType).toBeDefined();
          expect(group.quantity).toBeGreaterThan(0);
          expect(group.pricePerTicket).toBeDefined();
          expect(group.subtotal).toBeDefined();
          expect(group.seats).toBeInstanceOf(Array);
        });
      });

      it('should call cinema service for showtime details', async () => {
        // Act
        await ctx.bookingController.getSummary({
          id: testBookingId,
          userId: testUserId,
        });

        // Assert - Cinema client was called
        expect(ctx.mockCinemaClient.send).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // 1.5 cancelBooking
  // ============================================================================

  describe('1.5 cancelBooking', () => {
    describe('Success Scenarios', () => {
      it('should cancel a pending booking', async () => {
        // Arrange
        const bookingId = await seedPendingBooking(ctx.prisma, testUserId);

        // Act
        const result = await ctx.bookingController.cancel({
          id: bookingId,
          userId: testUserId,
          reason: 'Changed my mind',
        });

        // Assert
        expect(result.message).toBe('Booking cancelled successfully');
        expect(result.data.status).toBe(BookingStatus.CANCELLED);

        // Verify in database
        await verifyBookingStatus(
          ctx.prisma,
          bookingId,
          BookingStatus.CANCELLED
        );
      });

      it('should cancel a confirmed booking', async () => {
        // Arrange
        const { bookingId } = await seedConfirmedBooking(
          ctx.prisma,
          testUserId
        );

        // Act
        const result = await ctx.bookingController.cancel({
          id: bookingId,
          userId: testUserId,
        });

        // Assert
        expect(result.data.status).toBe(BookingStatus.CANCELLED);
      });

      it('should set cancellation reason and timestamp', async () => {
        // Arrange
        const bookingId = await seedPendingBooking(ctx.prisma, testUserId);
        const reason = 'Test cancellation reason';

        // Act
        await ctx.bookingController.cancel({
          id: bookingId,
          userId: testUserId,
          reason,
        });

        // Assert
        const booking = await ctx.prisma.bookings.findUnique({
          where: { id: bookingId },
        });
        expect(booking?.cancellation_reason).toBe(reason);
        expect(booking?.cancelled_at).not.toBeNull();
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw error for non-existent booking', async () => {
        // Act & Assert
        await expect(
          ctx.bookingController.cancel({
            id: '00000000-0000-0000-0000-000000000000',
            userId: testUserId,
          })
        ).rejects.toThrow('Booking not found');
      });

      it('should throw error when cancelling already cancelled booking', async () => {
        // Arrange
        const bookingId = await seedPendingBooking(ctx.prisma, testUserId);
        // First cancel
        await ctx.bookingController.cancel({
          id: bookingId,
          userId: testUserId,
        });

        // Act & Assert - Try to cancel again
        await expect(
          ctx.bookingController.cancel({
            id: bookingId,
            userId: testUserId,
          })
        ).rejects.toThrow('Cannot cancel this booking');
      });
    });
  });

  // ============================================================================
  // 1.6 adminFindAll
  // ============================================================================

  describe('1.6 adminFindAll', () => {
    beforeEach(async () => {
      // Create various bookings
      await seedPendingBooking(ctx.prisma, 'user-1', '10000000-0000-0000-0000-000000000001');
      await seedConfirmedBooking(ctx.prisma, 'user-2', '10000000-0000-0000-0000-000000000002');
      await seedPendingBooking(ctx.prisma, 'user-3', '10000000-0000-0000-0000-000000000003');
    });

    describe('Success Scenarios', () => {
      it('should return all bookings (admin view)', async () => {
        // Act
        const result = await ctx.bookingController.adminFindAll({
          filters: { page: 1, limit: 10 },
        });

        // Assert
        expect(result.data.length).toBe(3);
        expect(result.meta?.totalRecords).toBe(3);
      });

      it('should filter by userId', async () => {
        // Act
        const result = await ctx.bookingController.adminFindAll({
          filters: { userId: 'user-1', page: 1, limit: 10 },
        });

        // Assert
        expect(result.data.length).toBe(1);
      });

      it('should filter by status', async () => {
        // Act
        const result = await ctx.bookingController.adminFindAll({
          filters: { status: BookingStatus.CONFIRMED, page: 1, limit: 10 },
        });

        // Assert
        expect(result.data.length).toBe(1);
        expect(result.data[0].status).toBe(BookingStatus.CONFIRMED);
      });

      it('should filter by date range', async () => {
        // Arrange
        const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
        const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

        // Act
        const result = await ctx.bookingController.adminFindAll({
          filters: { startDate, endDate, page: 1, limit: 10 },
        });

        // Assert - Should return all recent bookings
        expect(result.data.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // Booking Status Transitions
  // ============================================================================

  describe('Booking Status Transitions', () => {
    it('should transition PENDING -> CONFIRMED via confirm endpoint', async () => {
      // Arrange
      const bookingId = await seedPendingBooking(ctx.prisma, testUserId);

      // Act
      const result = await ctx.bookingController.confirm({
        bookingId,
      });

      // Assert
      expect(result.data.status).toBe(BookingStatus.CONFIRMED);
      await verifyBookingStatus(ctx.prisma, bookingId, BookingStatus.CONFIRMED);
    });

    it('should transition CONFIRMED -> COMPLETED via complete endpoint', async () => {
      // Arrange
      const { bookingId } = await seedConfirmedBooking(ctx.prisma, testUserId);

      // Act
      const result = await ctx.bookingController.complete({
        bookingId,
      });

      // Assert
      expect(result.data.status).toBe(BookingStatus.COMPLETED);
    });

    it('should transition PENDING -> EXPIRED via expire endpoint', async () => {
      // Arrange
      const bookingId = await seedPendingBooking(ctx.prisma, testUserId);

      // Act
      const result = await ctx.bookingController.expire({
        bookingId,
      });

      // Assert
      expect(result.data.status).toBe(BookingStatus.EXPIRED);
    });
  });
});
