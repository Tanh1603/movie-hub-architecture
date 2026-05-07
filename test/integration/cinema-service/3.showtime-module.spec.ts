/**
 * Showtime Module Integration Tests
 *
 * Tests the Showtime operations:
 * - getShowtimes
 * - getShowtimeById
 * - getMovieShowtimesAtCinema
 * - adminGetMovieShowtimes
 * - getShowtimeSeats
 * - getSeatsHeldByUser
 * - getSessionTTL
 * - createShowtime
 * - batchCreateShowtimes
 * - updateShowtime
 * - cancelShowtime (deleteShowtime)
 *
 * @see test/docs/CINEMA_SERVICE_INTEGRATION_TEST_DOCS.md Section 3
 */

import {
  CinemaTestContext,
  createCinemaTestingModule,
  cleanupCinemaTestData,
  closeCinemaTestContext,
} from './helpers/cinema-test-helpers';
import { NotFoundException } from '@nestjs/common';
import { of } from 'rxjs';

describe('Showtime Module Integration Tests', () => {
  let ctx: CinemaTestContext;

  // ============================================================================
  // TEST LIFECYCLE
  // ============================================================================

  beforeAll(async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true,
      configurable: true,
    });
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5437/movie_hub_cinema?schema=public';
    ctx = await createCinemaTestingModule();
  }, 60000);

  afterAll(async () => {
    await cleanupCinemaTestData(ctx.prisma);
    await closeCinemaTestContext(ctx);
  }, 30000);

  beforeEach(async () => {
    await cleanupCinemaTestData(ctx.prisma);
    // Reset mocks
    ctx.mockMovieClient.send.mockClear();
    ctx.mockRealtimeService.getOrSetCache.mockClear();
    ctx.mockRealtimeService.getAllHeldSeats.mockClear();
    ctx.mockRealtimeService.getUserHeldSeats.mockClear();
  });

  // ============================================================================
  // Test Data Helpers
  // ============================================================================

  async function createTestCinemaWithHall() {
    const cinema = await ctx.prisma.cinemas.create({
      data: {
        name: 'Test Cinema',
        address: '123 Test St',
        city: 'Ho Chi Minh City',
        status: 'ACTIVE',
      },
    });

    const hall = await ctx.prisma.halls.create({
      data: {
        cinema_id: cinema.id,
        name: 'Hall 1',
        type: 'STANDARD',
        capacity: 100,
        rows: 10,
        status: 'ACTIVE',
        seats: {
          create: [
            {
              row_letter: 'A',
              seat_number: 1,
              type: 'STANDARD',
              status: 'ACTIVE',
            },
            {
              row_letter: 'A',
              seat_number: 2,
              type: 'STANDARD',
              status: 'ACTIVE',
            },
            { row_letter: 'B', seat_number: 1, type: 'VIP', status: 'ACTIVE' },
          ],
        },
      },
    });

    // Create ticket pricing
    await ctx.prisma.ticketPricing.createMany({
      data: [
        {
          hall_id: hall.id,
          seat_type: 'STANDARD',
          day_type: 'WEEKDAY',
          price: 80000,
        },
        {
          hall_id: hall.id,
          seat_type: 'STANDARD',
          day_type: 'WEEKEND',
          price: 100000,
        },
        {
          hall_id: hall.id,
          seat_type: 'VIP',
          day_type: 'WEEKDAY',
          price: 150000,
        },
        {
          hall_id: hall.id,
          seat_type: 'VIP',
          day_type: 'WEEKEND',
          price: 180000,
        },
      ],
    });

    return { cinema, hall };
  }

  async function createTestShowtime(
    cinemaId: string,
    hallId: string,
    options: Partial<{
      status: string;
      startTime: Date;
      movieId: string;
      movieReleaseId: string;
    }> = {}
  ) {
    const startTime =
      options.startTime || new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours

    return ctx.prisma.showtimes.create({
      data: {
        cinema_id: cinemaId,
        hall_id: hallId,
        movie_id: options.movieId || '00000000-0000-0000-0000-000000000001',
        movie_release_id: options.movieReleaseId || '00000000-0000-0000-0000-000000000002',
        start_time: startTime,
        end_time: endTime,
        format: 'TWO_D' as any,
        language: 'Vietnamese',
        subtitles: ['English'],
        status: (options.status as any) || 'SELLING',
        total_seats: 100,
        available_seats: 100,
        day_type: 'WEEKDAY' as any,
      } as any,
    });
  }

  // ============================================================================
  // 3.1 getShowtimes
  // ============================================================================

  describe('3.1 getShowtimes', () => {
    let testCinemaId: string;
    let testHallId: string;

    beforeEach(async () => {
      const { cinema, hall } = await createTestCinemaWithHall();
      testCinemaId = cinema.id;
      testHallId = hall.id;

      // Create multiple showtimes with different dates
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);

      await createTestShowtime(testCinemaId, testHallId, {
        startTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
        movieId: '00000000-0000-0000-0000-000000000001',
        movieReleaseId: '00000000-0000-0000-0000-000000000001',
      });
      await createTestShowtime(testCinemaId, testHallId, {
        startTime: new Date(tomorrow.setHours(14, 0, 0, 0)),
        movieId: '00000000-0000-0000-0000-000000000001',
        movieReleaseId: '00000000-0000-0000-0000-000000000001',
      });
      await createTestShowtime(testCinemaId, testHallId, {
        startTime: threeDaysLater,
        movieId: '00000000-0000-0000-0000-000000000002',
        movieReleaseId: '00000000-0000-0000-0000-000000000001',
      });

      // Mock movie service
      ctx.mockMovieClient.send.mockImplementation(() =>
        of({
          data: [
            { id: '00000000-0000-0000-0000-000000000001', title: 'Test Movie 1' },
            { id: '00000000-0000-0000-0000-000000000002', title: 'Test Movie 2' },
          ],
        })
      );
    });

    describe('Success Scenarios', () => {
      it('should return all showtimes for a cinema', async () => {
        // Act
        const result = await ctx.showtimeController.getShowtimes({
          cinemaId: testCinemaId,
        });

        // Assert
        expect(result.message).toBe('Fetch showtimes successfully');
        expect(result.data.length).toBe(3);

        // Verify movie titles are fetched from movie service
        expect(ctx.mockMovieClient.send).toHaveBeenCalled();
      });

      it('should filter showtimes by date', async () => {
        // Arrange
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local time

        // Act
        const result = await ctx.showtimeController.getShowtimes({
          cinemaId: testCinemaId,
          date: tomorrowStr,
        });

        // Assert - Should only return tomorrow's showtimes
        expect(result.data.length).toBe(2);
      });

      it('should filter showtimes by movieId', async () => {
        // Act
        const result = await ctx.showtimeController.getShowtimes({
          cinemaId: testCinemaId,
          movieId: '00000000-0000-0000-0000-000000000001',
        });

        // Assert
        expect(result.data.length).toBe(2);
        result.data.forEach((showtime) => {
          expect(showtime.movieId).toBe('00000000-0000-0000-0000-000000000001');
        });
      });

      it('should return showtimes ordered by start_time ascending', async () => {
        // Act
        const result = await ctx.showtimeController.getShowtimes({
          cinemaId: testCinemaId,
        });

        // Assert
        const times = result.data.map((s) => s.startTime.getTime());
        const sortedTimes = [...times].sort((a, b) => a - b);
        expect(times).toEqual(sortedTimes);
      });

      it('should return empty array when no showtimes match filters', async () => {
        // Act
        const result = await ctx.showtimeController.getShowtimes({
          cinemaId: '00000000-0000-0000-0000-000000000000',
        });

        // Assert
        expect(result.data).toEqual([]);
      });
    });
  });

  // ============================================================================
  // 3.2 getShowtimeById
  // ============================================================================

  describe('3.2 getShowtimeById', () => {
    let testShowtimeId: string;

    beforeEach(async () => {
      const { cinema, hall } = await createTestCinemaWithHall();
      const showtime = await createTestShowtime(cinema.id, hall.id);
      testShowtimeId = showtime.id;
    });

    describe('Success Scenarios', () => {
      it('should return showtime details', async () => {
        // Act
        const result = await ctx.showtimeController.getShowtime(testShowtimeId);

        // Assert
        expect(result.message).toBe('Fetch showtime successfully');
        expect(result.data.id).toBe(testShowtimeId);
        expect(result.data.format).toBe('TWO_D');
        expect(result.data.language).toBe('Vietnamese');
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw NotFoundException for non-existent showtime', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.showtimeController.getShowtime(nonExistentId)
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  // ============================================================================
  // 3.3 getMovieShowtimesAtCinema (with cache)
  // ============================================================================

  describe('3.3 getMovieShowtimesAtCinema', () => {
    let testCinemaId: string;
    let testHallId: string;

    beforeEach(async () => {
      const { cinema, hall } = await createTestCinemaWithHall();
      testCinemaId = cinema.id;
      testHallId = hall.id;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(16, 0, 0, 0);

      // Only SELLING status showtimes should be returned
      await createTestShowtime(testCinemaId, testHallId, {
        startTime: tomorrow,
        movieId: '00000000-0000-0000-0000-000000000003',
        status: 'SELLING',
        movieReleaseId: '00000000-0000-0000-0000-000000000001',
      });
      await createTestShowtime(testCinemaId, testHallId, {
        startTime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000),
        movieId: '00000000-0000-0000-0000-000000000003',
        status: 'SCHEDULED', // Should NOT be returned
        movieReleaseId: '00000000-0000-0000-0000-000000000001',
      });
    });

    describe('Success Scenarios', () => {
      it('should return only SELLING status showtimes', async () => {
        // Arrange
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local time

        // Act
        const result = await ctx.showtimeController.getMovieShowtimesAtCinema({
          cinemaId: testCinemaId,
          movieId: '00000000-0000-0000-0000-000000000003',
          query: { date: tomorrowStr },
        });

        // Assert
        expect(result.message).toBe('Fetch showtimes successfully');
        // Only the SELLING showtime should be returned
        expect(result.data.length).toBe(1);
      });

      it('should use cache via RealtimeService.getOrSetCache', async () => {
        // Arrange
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local time

        // Act
        await ctx.showtimeController.getMovieShowtimesAtCinema({
          cinemaId: testCinemaId,
          movieId: '00000000-0000-0000-0000-000000000003',
          query: { date: tomorrowStr },
        });

        // Assert - Cache should be accessed
        expect(ctx.mockRealtimeService.getOrSetCache).toHaveBeenCalled();
      });

      it('should return empty array when no showtimes for movie', async () => {
        // Arrange
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local time

        // Act
        const result = await ctx.showtimeController.getMovieShowtimesAtCinema({
          cinemaId: testCinemaId,
          movieId: '00000000-0000-0000-0000-000000000000',
          query: { date: tomorrowStr },
        });

        // Assert
        expect(result.data).toEqual([]);
      });
    });
  });

  // ============================================================================
  // 3.6 getSeatsHeldByUser
  // ============================================================================

  describe('3.6 getSeatsHeldByUser', () => {
    let testShowtimeId: string;
    let testHallId: string;

    beforeEach(async () => {
      const { cinema, hall } = await createTestCinemaWithHall();
      testHallId = hall.id;

      const showtime = await createTestShowtime(cinema.id, hall.id);
      testShowtimeId = showtime.id;
    });

    describe('Success Scenarios', () => {
      it('should return empty seats array when user has no held seats', async () => {
        // Arrange - Mock no held seats
        ctx.mockRealtimeService.getUserHeldSeats.mockResolvedValue([]);
        ctx.mockRealtimeService.getUserTTL.mockResolvedValue(-2);

        // Act
        const result = await ctx.showtimeController.getSeatsHeldByUser({
          showtimeId: testShowtimeId,
          userId: 'test-user',
        });

        // Assert
        expect(result.seats).toEqual([]);
        expect(result.lockTtl).toBe(-2);
      });

      it('should return seats with prices when user has held seats', async () => {
        // Arrange - Create seats and mock held seats
        const seats = await ctx.prisma.seats.findMany({
          where: { hall_id: testHallId },
          take: 2,
        });
        const seatIds = seats.map((s) => s.id);

        ctx.mockRealtimeService.getUserHeldSeats.mockResolvedValue(seatIds);
        ctx.mockRealtimeService.getUserTTL.mockResolvedValue(500);

        // Act
        const result = await ctx.showtimeController.getSeatsHeldByUser({
          showtimeId: testShowtimeId,
          userId: 'test-user',
        });

        // Assert
        expect(result.seats.length).toBe(2);
        expect(result.lockTtl).toBe(500);
        result.seats.forEach((seat) => {
          expect(seat.price).toBeGreaterThan(0);
          expect(seat.rowLetter).toBeDefined();
          expect(seat.seatNumber).toBeDefined();
        });
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw NotFoundException for non-existent showtime', async () => {
        // Act & Assert
        await expect(
          ctx.showtimeController.getSeatsHeldByUser({
            showtimeId: '00000000-0000-0000-0000-000000000000',
            userId: 'test-user',
          })
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  // ============================================================================
  // 3.7 getSessionTTL
  // ============================================================================

  describe('3.7 getSessionTTL', () => {
    describe('Success Scenarios', () => {
      it('should return TTL from RealtimeService', async () => {
        // Arrange
        ctx.mockRealtimeService.getUserTTL.mockResolvedValue(300);

        // Act
        const result = await ctx.showtimeController.getSessionTTL({
          showtimeId: 'any-id',
          userId: 'test-user',
        });

        // Assert
        expect(result.ttl).toBe(300);
      });

      it('should return -2 when no session exists', async () => {
        // Arrange
        ctx.mockRealtimeService.getUserTTL.mockResolvedValue(-2);

        // Act
        const result = await ctx.showtimeController.getSessionTTL({
          showtimeId: 'any-id',
          userId: 'test-user',
        });

        // Assert
        expect(result.ttl).toBe(-2);
      });
    });
  });

  // ============================================================================
  // 3.8 createShowtime
  // ============================================================================

  describe('3.8 createShowtime', () => {
    let testCinemaId: string;
    let testHallId: string;

    beforeEach(async () => {
      const { cinema, hall } = await createTestCinemaWithHall();
      testCinemaId = cinema.id;
      testHallId = hall.id;

      // Mock movie service for movie details
      ctx.mockMovieClient.send.mockImplementation((pattern: string) => {
        if (pattern.includes('GET_DETAIL')) {
          return of({
            data: {
              id: '00000000-0000-0000-0000-000000000001',
              title: 'Test Movie',
              runtime: 120,
            },
          });
        }
        // For GET_LIST_RELEASE
        return of({
          data: [
            {
              id: '00000000-0000-0000-0000-000000000001',
              movieId: '00000000-0000-0000-0000-000000000001',
              releaseStartDate: new Date('2020-01-01'),
              releaseEndDate: new Date('2030-12-31'),
            },
          ],
        });
      });
    });

    describe('Success Scenarios', () => {
      it('should create showtime with calculated end_time', async () => {
        // Arrange
        const startTime = new Date();
        startTime.setDate(startTime.getDate() + 1);
        startTime.setHours(14, 0, 0, 0);

        const request = {
          movieId: '00000000-0000-0000-0000-000000000001',
          movieReleaseId: '00000000-0000-0000-0000-000000000001',
          cinemaId: testCinemaId,
          hallId: testHallId,
          startTime: startTime.toISOString(),
          format: 'TWO_D' as const,
          language: 'Vietnamese',
          subtitles: ['English'],
          status: 'SCHEDULED' as any,
        };

        // Act
        const result = await ctx.showtimeController.createShowtime(request as any);

        // Assert
        expect(result.message).toBe('Showtime created successfully');
        expect(result.data.id).toBeDefined();
        expect(result.data.cinemaId).toBe(testCinemaId);
        expect(result.data.hallId).toBe(testHallId);

        // Verify in database
        const dbShowtime = await ctx.prisma.showtimes.findUnique({
          where: { id: result.data.id },
        });
        expect(dbShowtime).not.toBeNull();
        expect(dbShowtime?.status).toBe('SCHEDULED');
      });

      it('should auto-set total_seats from hall capacity', async () => {
        // Arrange
        const startTime = new Date();
        startTime.setDate(startTime.getDate() + 2);
        startTime.setHours(18, 0, 0, 0);

        const request = {
          movieId: '00000000-0000-0000-0000-000000000001',
          movieReleaseId: '00000000-0000-0000-0000-000000000001',
          cinemaId: testCinemaId,
          hallId: testHallId,
          startTime: startTime.toISOString(),
          format: 'TWO_D' as const,
          language: 'Vietnamese',
          subtitles: [],
          status: 'SCHEDULED' as any,
        };

        // Act
        const result = await ctx.showtimeController.createShowtime(request as any);

        // Assert
        const dbShowtime = await ctx.prisma.showtimes.findUnique({
          where: { id: result.data.id },
        });
        expect(dbShowtime?.total_seats).toBeGreaterThan(0);
        expect(dbShowtime?.available_seats).toBe(dbShowtime?.total_seats);
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw error for inactive cinema', async () => {
        // Arrange - Set cinema to maintenance
        await ctx.prisma.cinemas.update({
          where: { id: testCinemaId },
          data: { status: 'MAINTENANCE' },
        });

        const startTime = new Date();
        startTime.setDate(startTime.getDate() + 1);

        const request = {
          movieId: '00000000-0000-0000-0000-000000000001',
          movieReleaseId: '00000000-0000-0000-0000-000000000001',
          cinemaId: testCinemaId,
          hallId: testHallId,
          startTime: startTime.toISOString(),
          format: 'TWO_D' as const,
          language: 'Vietnamese',
        };

        // Act & Assert
        await expect(
          ctx.showtimeController.createShowtime(request as any)
        ).rejects.toMatchObject({
          error: expect.objectContaining({
            code: 'CINEMA_INACTIVE',
          }),
        });
      });

      it('should throw error for inactive hall', async () => {
        // Arrange - Set hall to maintenance
        await ctx.prisma.halls.update({
          where: { id: testHallId },
          data: { status: 'MAINTENANCE' },
        });

        const startTime = new Date();
        startTime.setDate(startTime.getDate() + 1);

        const request = {
          movieId: '00000000-0000-0000-0000-000000000001',
          movieReleaseId: '00000000-0000-0000-0000-000000000001',
          cinemaId: testCinemaId,
          hallId: testHallId,
          startTime: startTime.toISOString(),
          format: 'TWO_D' as const,
          language: 'Vietnamese',
        };

        // Act & Assert
        await expect(
          ctx.showtimeController.createShowtime(request as any)
        ).rejects.toMatchObject({
          error: expect.objectContaining({
            code: 'HALL_INACTIVE',
          }),
        });
      });
    });
  });

  // ============================================================================
  // 3.11 cancelShowtime (deleteShowtime)
  // ============================================================================

  describe('3.11 cancelShowtime', () => {
    let testCinemaId: string;
    let testHallId: string;

    beforeEach(async () => {
      const { cinema, hall } = await createTestCinemaWithHall();
      testCinemaId = cinema.id;
      testHallId = hall.id;
    });

    describe('Success Scenarios', () => {
      it('should delete showtime with no reservations', async () => {
        // Arrange
        const showtime = await createTestShowtime(testCinemaId, testHallId);

        // Act
        const result = await ctx.showtimeController.deleteShowtime({
          showtimeId: showtime.id,
        });

        // Assert
        expect(result.message).toBe('Showtime deleted successfully');

        // Verify deleted
        const dbShowtime = await ctx.prisma.showtimes.findUnique({
          where: { id: showtime.id },
        });
        expect(dbShowtime).toBeNull();
      });

      it('should handle showtime with reservations', async () => {
        // Arrange - Create showtime with a reservation
        const showtime = await createTestShowtime(testCinemaId, testHallId);

        // Get a seat
        const seat = await ctx.prisma.seats.findFirst({
          where: { hall_id: testHallId },
        });

        // Create reservation
        await ctx.prisma.seatReservations.create({
          data: {
            showtime_id: showtime.id,
            seat_id: seat!.id,
            user_id: 'test-user',
            status: 'CONFIRMED',
          },
        });

        // Act
        const result = await ctx.showtimeController.deleteShowtime({
          showtimeId: showtime.id,
        });

        // Assert - Should still succeed (sets to CANCELLED then deletes)
        expect(result.message).toBe('Showtime cancelled successfully');
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw error for non-existent showtime', async () => {
        // Act & Assert
        await expect(
          ctx.showtimeController.deleteShowtime({
            showtimeId: '00000000-0000-0000-0000-000000000000',
          })
        ).rejects.toMatchObject({
          error: expect.objectContaining({
            code: 'SHOWTIME_NOT_FOUND',
          }),
        });
      });
    });
  });
});
