/**
 * Hall Module Integration Tests
 *
 * Tests the Hall CRUD operations:
 * - getHallDetail
 * - getHallsOfCinema
 * - createHall
 * - updateHall
 * - deleteHall
 * - updateSeatStatus
 *
 * @see test/docs/CINEMA_SERVICE_INTEGRATION_TEST_DOCS.md Section 4
 */

import {
  CinemaTestContext,
  createCinemaTestingModule,
  cleanupCinemaTestData,
  closeCinemaTestContext,
  createTestCinemaRequest,
  createTestHallRequest,
} from './helpers/cinema-test-helpers';
import {
  HallStatusEnum,
  ResourceNotFoundException,
} from '@movie-hub/shared-types';
import { NotFoundException } from '@nestjs/common';

describe('Hall Module Integration Tests', () => {
  let ctx: CinemaTestContext;

  // ============================================================================
  // TEST LIFECYCLE
  // ============================================================================

  beforeAll(async () => {
    // Set test environment variables
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
  });

  // ============================================================================
  // Test Data Helpers
  // ============================================================================

  async function createActiveCinema(): Promise<string> {
    const cinema = await ctx.prisma.cinemas.create({
      data: {
        name: 'Test Cinema',
        address: '123 Test St',
        city: 'Ho Chi Minh City',
        status: 'ACTIVE',
      },
    });
    return cinema.id;
  }

  async function createHallWithSeats(
    cinemaId: string,
    name = 'Test Hall'
  ): Promise<string> {
    const hall = await ctx.prisma.halls.create({
      data: {
        cinema_id: cinemaId,
        name,
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
            { row_letter: 'A', seat_number: 3, type: 'VIP', status: 'ACTIVE' },
            {
              row_letter: 'B',
              seat_number: 1,
              type: 'STANDARD',
              status: 'ACTIVE',
            },
            {
              row_letter: 'B',
              seat_number: 2,
              type: 'STANDARD',
              status: 'ACTIVE',
            },
          ],
        },
      },
    });
    return hall.id;
  }

  // ============================================================================
  // 4.1 getHallDetail
  // ============================================================================

  describe('4.1 getHallDetail', () => {
    let testCinemaId: string;
    let testHallId: string;

    beforeEach(async () => {
      testCinemaId = await createActiveCinema();
      testHallId = await createHallWithSeats(testCinemaId);
    });

    describe('Success Scenarios', () => {
      it('should return detailed hall info with all seats', async () => {
        // Act
        const result = await ctx.hallController.getHallDetail(testHallId);

        // Assert
        expect(result.message).toBe('Get hall successfully!');
        expect(result.data.id).toBe(testHallId);
        expect(result.data.name).toBe('Test Hall');
        expect(result.data.type).toBe('STANDARD');
        expect(result.data.capacity).toBe(100);
        expect(result.data.rows).toBe(10);
        expect(result.data.status).toBe('ACTIVE');

        // Verify seat map structure
        expect(result.data.seatMap).toBeDefined();
        expect(result.data.seatMap.length).toBe(2); // Rows A and B

        // Check row A
        const rowA = result.data.seatMap.find((r) => r.row === 'A');
        expect(rowA).toBeDefined();
        expect(rowA?.seats.length).toBe(3);
      });

      it('should include seat details with correct types', async () => {
        // Act
        const result = await ctx.hallController.getHallDetail(testHallId);

        // Assert
        const allSeats = result.data.seatMap.flatMap((r) => r.seats);
        expect(allSeats.length).toBe(5);

        // Check seat structure
        const vipSeat = allSeats.find((s) => s.type === 'VIP');
        expect(vipSeat).toBeDefined();
        expect(vipSeat?.rowLetter).toBe('A');
        expect(vipSeat?.seatNumber).toBe(3);
      });

      it('should return seats sorted by row and seat number', async () => {
        // Act
        const result = await ctx.hallController.getHallDetail(testHallId);

        // Assert - rows should be sorted A, B
        const rows = result.data.seatMap.map((r) => r.row);
        expect(rows).toEqual(['A', 'B']);

        // Each row's seats should be sorted by seatNumber
        result.data.seatMap.forEach((row) => {
          const numbers = row.seats.map((s) => s.seatNumber);
          const sortedNumbers = [...numbers].sort((a, b) => a - b);
          expect(numbers).toEqual(sortedNumbers);
        });
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw ResourceNotFoundException for non-existent hall', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.hallController.getHallDetail(nonExistentId)
        ).rejects.toThrow(ResourceNotFoundException);
      });
    });
  });

  // ============================================================================
  // 4.2 getHallsOfCinema
  // ============================================================================

  describe('4.2 getHallsOfCinema', () => {
    let testCinemaId: string;

    beforeEach(async () => {
      testCinemaId = await createActiveCinema();

      // Create halls with different statuses
      await ctx.prisma.halls.createMany({
        data: [
          {
            cinema_id: testCinemaId,
            name: 'Hall 1',
            type: 'STANDARD',
            capacity: 100,
            rows: 10,
            status: 'ACTIVE',
          },
          {
            cinema_id: testCinemaId,
            name: 'Hall 2',
            type: 'VIP',
            capacity: 50,
            rows: 5,
            status: 'ACTIVE',
          },
          {
            cinema_id: testCinemaId,
            name: 'Hall 3',
            type: 'IMAX',
            capacity: 200,
            rows: 15,
            status: 'MAINTENANCE',
          },
          {
            cinema_id: testCinemaId,
            name: 'Hall 4',
            type: 'STANDARD',
            capacity: 100,
            rows: 10,
            status: 'CLOSED',
          },
        ],
      });
    });

    describe('Success Scenarios', () => {
      it('should return only ACTIVE halls for cinema', async () => {
        // Act
        const result = await ctx.hallController.getHallsOfCinema({
          cinemaId: testCinemaId,
          status: HallStatusEnum.ACTIVE,
        });

        // Assert
        expect(result.message).toBe('Get halls of cinema successfully!');
        expect(result.data.length).toBe(2);
        result.data.forEach((hall) => {
          expect(hall.status).toBe('ACTIVE');
        });
      });

      it('should return MAINTENANCE halls', async () => {
        // Act
        const result = await ctx.hallController.getHallsOfCinema({
          cinemaId: testCinemaId,
          status: HallStatusEnum.MAINTENANCE,
        });

        // Assert
        expect(result.data.length).toBe(1);
        expect(result.data[0].name).toBe('Hall 3');
      });

      it('should return empty array when no halls match status', async () => {
        // Act
        const result = await ctx.hallController.getHallsOfCinema({
          cinemaId: testCinemaId,
          status: HallStatusEnum.CLOSED,
        });

        // Assert
        expect(result.data.length).toBe(1);
        expect(result.data[0].name).toBe('Hall 4');
      });

      it('should return empty array for cinema with no halls', async () => {
        // Create another cinema without halls
        const emptycinema = await ctx.prisma.cinemas.create({
          data: {
            name: 'Empty',
            address: 'Addr',
            city: 'City',
            status: 'ACTIVE',
          },
        });

        // Act
        const result = await ctx.hallController.getHallsOfCinema({
          cinemaId: emptycinema.id,
          status: HallStatusEnum.ACTIVE,
        });

        // Assert
        expect(result.data).toEqual([]);
      });
    });
  });

  // ============================================================================
  // 4.3 createHall
  // ============================================================================

  describe('4.3 createHall', () => {
    let activeCinemaId: string;

    beforeEach(async () => {
      activeCinemaId = await createActiveCinema();
    });

    describe('Success Scenarios', () => {
      it('should create hall with STANDARD layout and auto-generate seats', async () => {
        // Arrange
        const request: any = createTestHallRequest(activeCinemaId, {
          name: 'New Standard Hall',
          type: 'STANDARD',
          layoutType: 'STANDARD',
        });

        // Act
        const result = await ctx.hallController.createHall(request);

        // Assert - Response
        expect(result.message).toBe('Create hall successfully!');
        expect(result.data.id).toBeDefined();
        expect(result.data.name).toBe('New Standard Hall');
        expect(result.data.type).toBe('STANDARD');
        expect(result.data.layoutType).toBe('STANDARD');

        // Assert - Seats were auto-generated
        expect(result.data.seatMap.length).toBeGreaterThan(0);

        // Verify in database
        const dbHall = await ctx.prisma.halls.findUnique({
          where: { id: result.data.id },
          include: { seats: true },
        });
        expect(dbHall).not.toBeNull();
        expect(dbHall?.seats.length).toBeGreaterThan(0);
      });

      it('should auto-create ticket pricing for each seat type', async () => {
        // Arrange
        const request: any = createTestHallRequest(activeCinemaId);

        // Act
        const result = await ctx.hallController.createHall(request);

        // Assert - Verify pricing was created
        const pricing = await ctx.prisma.ticketPricing.findMany({
          where: { hall_id: result.data.id },
        });
        expect(pricing.length).toBeGreaterThan(0);

        // Should have pricing for multiple day types (WEEKDAY, WEEKEND)
        const dayTypes = [...new Set(pricing.map((p) => p.day_type))];
        expect(dayTypes.length).toBeGreaterThan(1);
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw CINEMA_INACTIVE for inactive cinema', async () => {
        // Arrange - Create inactive cinema
        const inactiveCinema = await ctx.prisma.cinemas.create({
          data: {
            name: 'Inactive',
            address: 'Addr',
            city: 'City',
            status: 'MAINTENANCE',
          },
        });

        const request: any = createTestHallRequest(inactiveCinema.id);

        // Act & Assert
        await expect(
          ctx.hallController.createHall(request)
        ).rejects.toMatchObject({
          error: expect.objectContaining({
            code: 'CINEMA_INACTIVE',
            statusCode: 409,
          }),
        });
      });

      it('should throw ResourceNotFoundException for non-existent cinema', async () => {
        // Arrange
        const request: any = createTestHallRequest(
          '00000000-0000-0000-0000-000000000000'
        );

        // Act & Assert
        await expect(ctx.hallController.createHall(request)).rejects.toThrow();
      });
    });
  });

  // ============================================================================
  // 4.4 updateHall
  // ============================================================================

  describe('4.4 updateHall', () => {
    let testCinemaId: string;
    let testHallId: string;

    beforeEach(async () => {
      testCinemaId = await createActiveCinema();
      testHallId = await createHallWithSeats(
        testCinemaId,
        'Original Hall Name'
      );
    });

    describe('Success Scenarios', () => {
      it('should update hall name', async () => {
        // Arrange
        const updateRequest = { name: 'Updated Hall Name' };

        // Act
        const result = await ctx.hallController.updateHall({
          hallId: testHallId,
          updateHallRequest: updateRequest,
        });

        // Assert
        expect(result.message).toBe('Update hall successfully!');
        expect(result.data.name).toBe('Updated Hall Name');

        // Verify in database
        const dbHall = await ctx.prisma.halls.findUnique({
          where: { id: testHallId },
        });
        expect(dbHall?.name).toBe('Updated Hall Name');
      });

      it('should update multiple fields at once', async () => {
        // Arrange
        const updateRequest = {
          name: 'Premium Hall',
          screenType: '4K Laser',
          soundSystem: 'Dolby Atmos',
          features: ['Reclining Seats', 'Cup Holders'],
        };

        // Act
        const result = await ctx.hallController.updateHall({
          hallId: testHallId,
          updateHallRequest: updateRequest,
        });

        // Assert
        expect(result.data.name).toBe('Premium Hall');
        expect(result.data.screenType).toBe('4K Laser');
        expect(result.data.soundSystem).toBe('Dolby Atmos');
        expect(result.data.features).toEqual([
          'Reclining Seats',
          'Cup Holders',
        ]);
      });

      it('should update hall status', async () => {
        // Arrange
        const updateRequest: any = { status: 'MAINTENANCE' };

        // Act
        const result = await ctx.hallController.updateHall({
          hallId: testHallId,
          updateHallRequest: updateRequest,
        });

        // Assert
        expect(result.data.status).toBe('MAINTENANCE');
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw ResourceNotFoundException for non-existent hall', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.hallController.updateHall({
            hallId: nonExistentId,
            updateHallRequest: { name: 'New Name' },
          })
        ).rejects.toThrow(ResourceNotFoundException);
      });
    });
  });

  // ============================================================================
  // 4.5 deleteHall
  // ============================================================================

  describe('4.5 deleteHall', () => {
    let testCinemaId: string;

    beforeEach(async () => {
      testCinemaId = await createActiveCinema();
    });

    describe('Success Scenarios', () => {
      it('should delete hall with no showtimes', async () => {
        // Arrange
        const hallId = await createHallWithSeats(
          testCinemaId,
          'Hall To Delete'
        );

        // Verify it exists
        const beforeDelete = await ctx.prisma.halls.findUnique({
          where: { id: hallId },
        });
        expect(beforeDelete).not.toBeNull();

        // Act
        const result = await ctx.hallController.deleteHall(hallId);

        // Assert
        expect(result.message).toBe('Delete hall successfully!');
        expect(result.data).toBeUndefined();

        // Verify deleted
        const afterDelete = await ctx.prisma.halls.findUnique({
          where: { id: hallId },
        });
        expect(afterDelete).toBeNull();
      });

      it('should cascade delete seats and pricing', async () => {
        // Arrange - Create hall through controller (which creates pricing)
        const request: any = createTestHallRequest(testCinemaId);
        const createResult = await ctx.hallController.createHall(request);
        const hallId = createResult.data.id;

        // Verify seats and pricing exist
        const seatsBeforeDelete = await ctx.prisma.seats.count({
          where: { hall_id: hallId },
        });
        const pricingBeforeDelete = await ctx.prisma.ticketPricing.count({
          where: { hall_id: hallId },
        });
        expect(seatsBeforeDelete).toBeGreaterThan(0);
        expect(pricingBeforeDelete).toBeGreaterThan(0);

        // Act
        await ctx.hallController.deleteHall(hallId);

        // Assert - Seats and pricing should be deleted (cascade)
        const seatsAfterDelete = await ctx.prisma.seats.count({
          where: { hall_id: hallId },
        });
        const pricingAfterDelete = await ctx.prisma.ticketPricing.count({
          where: { hall_id: hallId },
        });
        expect(seatsAfterDelete).toBe(0);
        expect(pricingAfterDelete).toBe(0);
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw HALL_NOT_FOUND for non-existent hall', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.hallController.deleteHall(nonExistentId)
        ).rejects.toMatchObject({
          error: expect.objectContaining({
            code: 'HALL_NOT_FOUND',
            statusCode: 404,
          }),
        });
      });

      it('should throw HALL_IN_USE when hall has showtimes', async () => {
        // Arrange
        const hallId = await createHallWithSeats(testCinemaId);

        // Create a showtime for this hall
        await ctx.prisma.showtimes.create({
          data: {
            cinema_id: testCinemaId,
            hall_id: hallId,
            movie_id: '123e4567-e89b-12d3-a456-426614174001',
            movie_release_id: '123e4567-e89b-12d3-a456-426614174002',
            start_time: new Date(),
            end_time: new Date(Date.now() + 2 * 60 * 60 * 1000),
            status: 'SCHEDULED' as any,
            format: 'TWO_D' as any,
            language: 'Vietnamese',
            total_seats: 100,
            available_seats: 100,
            day_type: 'WEEKDAY' as any,
          } as any,
        });

        // Act & Assert
        await expect(
          ctx.hallController.deleteHall(hallId)
        ).rejects.toMatchObject({
          error: expect.objectContaining({
            code: 'HALL_IN_USE',
            statusCode: 400,
          }),
        });
      });
    });
  });

  // ============================================================================
  // 4.6 updateSeatStatus
  // ============================================================================

  describe('4.6 updateSeatStatus', () => {
    let testHallId: string;
    let testSeatId: string;

    beforeEach(async () => {
      const cinemaId = await createActiveCinema();
      testHallId = await createHallWithSeats(cinemaId);

      // Get a seat ID
      const seat = await ctx.prisma.seats.findFirst({
        where: { hall_id: testHallId },
      });
      testSeatId = seat!.id;
    });

    describe('Success Scenarios', () => {
      it('should update seat status to BROKEN', async () => {
        // Act
        const result = await ctx.hallController.updateSeatStatus({
          seatId: testSeatId,
          updateSeatStatusRequest: { status: 'BROKEN' },
        });

        // Assert
        expect(result.message).toBe('Seat updated successfully');

        // Verify in database
        const dbSeat = await ctx.prisma.seats.findUnique({
          where: { id: testSeatId },
        });
        expect(dbSeat?.status).toBe('BROKEN');
      });

      it('should update seat status to MAINTENANCE', async () => {
        // Act
        const result = await ctx.hallController.updateSeatStatus({
          seatId: testSeatId,
          updateSeatStatusRequest: { status: 'MAINTENANCE' },
        });

        // Assert
        const dbSeat = await ctx.prisma.seats.findUnique({
          where: { id: testSeatId },
        });
        expect(dbSeat?.status).toBe('MAINTENANCE');
      });

      it('should update seat status back to ACTIVE', async () => {
        // Arrange - First set to BROKEN
        await ctx.prisma.seats.update({
          where: { id: testSeatId },
          data: { status: 'BROKEN' },
        });

        // Act - Set back to ACTIVE
        await ctx.hallController.updateSeatStatus({
          seatId: testSeatId,
          updateSeatStatusRequest: { status: 'ACTIVE' },
        });

        // Assert
        const dbSeat = await ctx.prisma.seats.findUnique({
          where: { id: testSeatId },
        });
        expect(dbSeat?.status).toBe('ACTIVE');
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw NotFoundException for non-existent seat', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.hallController.updateSeatStatus({
            seatId: nonExistentId,
            updateSeatStatusRequest: { status: 'BROKEN' },
          })
        ).rejects.toThrow(NotFoundException);
      });
    });
  });
});
