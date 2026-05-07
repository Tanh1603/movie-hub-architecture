/**
 * Cinema Module Integration Tests
 *
 * Tests the Cinema CRUD operations (create, update, delete, getAllCinemas)
 * using the REAL PostgreSQL database.
 *
 * Test Strategy:
 * - Database: REAL PostgreSQL (via Docker)
 * - External Services: MOCKED (Movie RPC, Redis)
 * - Execution: Direct controller method invocation (no network)
 *
 * @see test/docs/CINEMA_SERVICE_INTEGRATION_TEST_DOCS.md
 */

import {
  CinemaTestContext,
  createCinemaTestingModule,
  cleanupCinemaTestData,
  closeCinemaTestContext,
  createTestCinemaRequest,
  verifyCinemaPersisted,
} from './helpers/cinema-test-helpers';
import {
  CinemaStatusEnum,
  ResourceNotFoundException,
} from '@movie-hub/shared-types';
import { RpcException } from '@nestjs/microservices';

describe('Cinema Module Integration Tests', () => {
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
    // Clean up test data
    await cleanupCinemaTestData(ctx.prisma);

    // Properly close connections to prevent Jest hangs
    await closeCinemaTestContext(ctx);
  }, 30000);

  beforeEach(async () => {
    // Clean up before each test for isolation
    await cleanupCinemaTestData(ctx.prisma);
  });

  // ============================================================================
  // 1.1 createCinema
  // ============================================================================

  describe('1.1 createCinema', () => {
    describe('Success Scenarios', () => {
      it('should create a cinema with all required fields', async () => {
        // Arrange
        const request: any = createTestCinemaRequest({
          name: 'CGV Vincom Center',
          address: '72 Le Thanh Ton, District 1',
          city: 'Ho Chi Minh City',
        });

        // Act
        const result = await ctx.cinemaController.createCinema(request as any);

        // Assert - Response structure
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('message', 'Create cinema successfully!');

        // Assert - Response data
        const cinema = result.data;
        expect(cinema).toHaveProperty('id');
        expect(cinema.name).toBe(request.name);
        expect(cinema.address).toBe(request.address);
        expect(cinema.city).toBe(request.city);

        // Assert - Persisted in database
        await verifyCinemaPersisted(ctx.prisma, cinema.id, request);
      });

      it('should create a cinema with all optional fields', async () => {
        // Arrange
        const request: any = createTestCinemaRequest({
          name: 'Galaxy Cinema Nguyen Du',
          address: '116 Nguyen Du, District 1',
          city: 'Ho Chi Minh City',
          district: 'District 1',
          phone: '1900 2224',
          email: 'contact@galaxycine.vn',
          website: 'https://www.galaxycine.vn',
          latitude: 10.77,
          longitude: 106.69,
          description: 'Modern cinema with premium experience',
          amenities: ['parking', 'wifi', 'food court', 'VIP lounge'],
          facilities: { parking: true, elevator: true, wheelchair: true },
          images: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
          ],
          virtualTour360Url: 'https://example.com/tour',
        });

        // Act
        const result = await ctx.cinemaController.createCinema(request as any);

        // Assert - Response data
        const cinema = result.data;
        expect(cinema.id).toBeDefined();
        expect(cinema.district).toBe(request.district);
        expect(cinema.phone).toBe(request.phone);
        expect(cinema.email).toBe(request.email);
        expect(cinema.amenities).toEqual(
          expect.arrayContaining(request.amenities!)
        );
        expect(cinema.virtualTour360Url).toBe(request.virtualTour360Url);

        // Assert - Database persistence
        const dbCinema = await ctx.prisma.cinemas.findUnique({
          where: { id: cinema.id },
        });

        expect(dbCinema).not.toBeNull();
        expect(dbCinema?.district).toBe(request.district);
        expect(dbCinema?.phone).toBe(request.phone);
        expect(dbCinema?.virtual_tour_360_url).toBe(request.virtualTour360Url);
      });

      it('should set default status to ACTIVE if not provided', async () => {
        // Arrange
        const request: any = createTestCinemaRequest();
        delete (request as any).status;

        // Act
        const result = await ctx.cinemaController.createCinema(request);

        // Assert
        expect(result.data.status).toBe('ACTIVE');

        // Verify in database
        const dbCinema = await ctx.prisma.cinemas.findUnique({
          where: { id: result.data.id },
        });
        expect(dbCinema?.status).toBe('ACTIVE');
      });

      it('should set default timezone to Asia/Ho_Chi_Minh', async () => {
        // Arrange
        const request: any = createTestCinemaRequest();

        // Act
        const result = await ctx.cinemaController.createCinema(request);

        // Assert
        expect(result.data.timezone).toBe('Asia/Ho_Chi_Minh');

        // Verify in database
        const dbCinema = await ctx.prisma.cinemas.findUnique({
          where: { id: result.data.id },
        });
        expect(dbCinema?.timezone).toBe('Asia/Ho_Chi_Minh');
      });

      it('should auto-populate created_at and updated_at timestamps', async () => {
        // Arrange
        const request: any = createTestCinemaRequest();
        const beforeCreate = new Date();

        // Act
        const result = await ctx.cinemaController.createCinema(request);

        // Assert
        const afterCreate = new Date();
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);

        // Verify timestamps are within expected range
        const dbCinema = await ctx.prisma.cinemas.findUnique({
          where: { id: result.data.id },
        });

        expect(dbCinema?.created_at.getTime()).toBeGreaterThanOrEqual(
          beforeCreate.getTime() - 1000
        );
        expect(dbCinema?.created_at.getTime()).toBeLessThanOrEqual(
          afterCreate.getTime() + 1000
        );
      });

      it('should generate a valid UUID for the cinema id', async () => {
        // Arrange
        const request: any = createTestCinemaRequest();

        // Act
        const result = await ctx.cinemaController.createCinema(request);

        // Assert - UUID format validation
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(result.data.id).toMatch(uuidRegex);
      });
    });

    describe('Failure Scenarios', () => {
      // Note: Validation errors depend on the DTO validation setup
      // These tests verify database-level constraints

      it('should handle duplicate cinema creation gracefully', async () => {
        // Arrange
        const request: any = createTestCinemaRequest({
          name: 'Unique Cinema Name',
        });

        // Act - Create first cinema
        await ctx.cinemaController.createCinema(request);

        // Act - Create second cinema with same name (should succeed - name is not unique)
        const result2 = await ctx.cinemaController.createCinema(request);

        // Assert - Both should exist
        expect(result2.data.id).toBeDefined();
      });
    });
  });

  // ============================================================================
  // 1.2 updateCinema
  // ============================================================================

  describe('1.2 updateCinema', () => {
    let existingCinemaId: string;

    beforeEach(async () => {
      // Create a cinema to update
      const request = createTestCinemaRequest({
        name: 'Original Cinema Name',
        address: 'Original Address',
        city: 'Ho Chi Minh City',
      });
      const result = await ctx.cinemaController.createCinema(request);
      existingCinemaId = result.data.id;
    });

    describe('Success Scenarios', () => {
      it('should update cinema name successfully', async () => {
        // Arrange
        const updateRequest = { name: 'Updated Cinema Name' };

        // Act
        const result = await ctx.cinemaController.updateCinema({
          cinemaId: existingCinemaId,
          updateCinemaRequest: updateRequest,
        });

        // Assert - Response
        expect(result.message).toBe('Update cinema successfully!');
        expect(result.data.name).toBe('Updated Cinema Name');

        // Assert - Database
        const dbCinema = await ctx.prisma.cinemas.findUnique({
          where: { id: existingCinemaId },
        });
        expect(dbCinema?.name).toBe('Updated Cinema Name');
      });

      it('should update cinema status to MAINTENANCE', async () => {
        // Arrange
        const updateRequest: any = { status: 'MAINTENANCE' as const };

        // Act
        const result = await ctx.cinemaController.updateCinema({
          cinemaId: existingCinemaId,
          updateCinemaRequest: updateRequest,
        });

        // Assert
        expect(result.data.status).toBe('MAINTENANCE');

        // Verify in database
        const dbCinema = await ctx.prisma.cinemas.findUnique({
          where: { id: existingCinemaId },
        });
        expect(dbCinema?.status).toBe('MAINTENANCE');
      });

      it('should update multiple fields at once', async () => {
        // Arrange
        const updateRequest = {
          name: 'Completely New Name',
          address: 'Brand New Address',
          phone: '0999999999',
          amenities: ['valet parking', 'premium lounge'],
        };

        // Act
        const result = await ctx.cinemaController.updateCinema({
          cinemaId: existingCinemaId,
          updateCinemaRequest: updateRequest,
        });

        // Assert
        expect(result.data.name).toBe(updateRequest.name);
        expect(result.data.address).toBe(updateRequest.address);
        expect(result.data.phone).toBe(updateRequest.phone);
        expect(result.data.amenities).toEqual(updateRequest.amenities);
      });

      it('should refresh updated_at timestamp on update', async () => {
        // Arrange
        const originalCinema = await ctx.prisma.cinemas.findUnique({
          where: { id: existingCinemaId },
        });
        const originalUpdatedAt = originalCinema?.updated_at;

        // Wait a bit to ensure timestamp difference
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Act
        await ctx.cinemaController.updateCinema({
          cinemaId: existingCinemaId,
          updateCinemaRequest: { name: 'Trigger Update' },
        });

        // Assert
        const updatedCinema = await ctx.prisma.cinemas.findUnique({
          where: { id: existingCinemaId },
        });
        expect(updatedCinema?.updated_at.getTime()).toBeGreaterThanOrEqual(
          originalUpdatedAt!.getTime()
        );
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw ResourceNotFoundException for non-existent cinema', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.cinemaController.updateCinema({
            cinemaId: nonExistentId,
            updateCinemaRequest: { name: 'New Name' },
          })
        ).rejects.toThrow(ResourceNotFoundException);
      });
    });
  });

  // ============================================================================
  // 1.3 deleteCinema
  // ============================================================================

  describe('1.3 deleteCinema', () => {
    describe('Success Scenarios', () => {
      it('should delete cinema with no dependencies', async () => {
        // Arrange - Create a cinema with no halls
        const request: any = createTestCinemaRequest();
        const created = await ctx.cinemaController.createCinema(request);
        const cinemaId = created.data.id;

        // Verify it exists
        const beforeDelete = await ctx.prisma.cinemas.findUnique({
          where: { id: cinemaId },
        });
        expect(beforeDelete).not.toBeNull();

        // Act
        const result = await ctx.cinemaController.deleteMovie(cinemaId);

        // Assert - Response
        expect(result.message).toBe('Delete cinema successfully!');
        expect(result.data).toBeUndefined();

        // Assert - Actually deleted from database
        const afterDelete = await ctx.prisma.cinemas.findUnique({
          where: { id: cinemaId },
        });
        expect(afterDelete).toBeNull();
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw CINEMA_NOT_FOUND for non-existent cinema', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.cinemaController.deleteMovie(nonExistentId)
        ).rejects.toMatchObject({
          error: expect.objectContaining({
            code: 'CINEMA_NOT_FOUND',
            statusCode: 404,
          }),
        });
      });

      it('should throw CINEMA_IN_USE when cinema has halls', async () => {
        // Arrange - Create cinema with a hall
        const cinemaRequest: any = createTestCinemaRequest();
        const cinemaResult = await ctx.cinemaController.createCinema(
          cinemaRequest
        );
        const cinemaId = cinemaResult.data.id;

        // Create a hall for this cinema
        await ctx.prisma.halls.create({
          data: {
            cinema_id: cinemaId,
            name: 'Test Hall',
            type: 'STANDARD',
            capacity: 100,
            rows: 10,
            status: 'ACTIVE',
          },
        });

        // Act & Assert
        await expect(
          ctx.cinemaController.deleteMovie(cinemaId)
        ).rejects.toMatchObject({
          error: expect.objectContaining({
            code: 'CINEMA_IN_USE',
            statusCode: 400,
          }),
        });

        // Cleanup - Delete hall first
        await ctx.prisma.halls.deleteMany({ where: { cinema_id: cinemaId } });
        await ctx.prisma.cinemas.delete({ where: { id: cinemaId } });
      });
    });
  });

  // ============================================================================
  // 1.4 getAllCinemas
  // ============================================================================

  describe('1.4 getAllCinemas', () => {
    beforeEach(async () => {
      // Create test cinemas with different statuses
      await ctx.prisma.cinemas.createMany({
        data: [
          {
            name: 'Active Cinema 1',
            address: 'Address 1',
            city: 'Ho Chi Minh City',
            status: 'ACTIVE',
          },
          {
            name: 'Active Cinema 2',
            address: 'Address 2',
            city: 'Hanoi',
            status: 'ACTIVE',
          },
          {
            name: 'Maintenance Cinema',
            address: 'Address 3',
            city: 'Da Nang',
            status: 'MAINTENANCE',
          },
          {
            name: 'Closed Cinema',
            address: 'Address 4',
            city: 'Can Tho',
            status: 'CLOSED',
          },
        ],
      });
    });

    describe('Success Scenarios', () => {
      it('should return all ACTIVE cinemas', async () => {
        // Act
        const result = await ctx.cinemaController.getAllCinemas(
          CinemaStatusEnum.ACTIVE
        );

        // Assert
        expect(result.message).toBe('Get all cinemas successfully!');
        expect(result.data).toBeInstanceOf(Array);
        expect(result.data.length).toBe(2);

        // All returned cinemas should be ACTIVE
        result.data.forEach((cinema) => {
          expect(cinema.status).toBe('ACTIVE');
        });
      });

      it('should return MAINTENANCE cinemas', async () => {
        // Act
        const result = await ctx.cinemaController.getAllCinemas(
          CinemaStatusEnum.MAINTENANCE
        );

        // Assert
        expect(result.data.length).toBe(1);
        expect(result.data[0].name).toBe('Maintenance Cinema');
        expect(result.data[0].status).toBe('MAINTENANCE');
      });

      it('should return CLOSED cinemas', async () => {
        // Act
        const result = await ctx.cinemaController.getAllCinemas(
          CinemaStatusEnum.CLOSED
        );

        // Assert
        expect(result.data.length).toBe(1);
        expect(result.data[0].name).toBe('Closed Cinema');
        expect(result.data[0].status).toBe('CLOSED');
      });

      it('should return cinemas ordered by name ascending', async () => {
        // Act
        const result = await ctx.cinemaController.getAllCinemas(
          CinemaStatusEnum.ACTIVE
        );

        // Assert - Check ordering
        const names = result.data.map((c) => c.name);
        const sortedNames = [...names].sort();
        expect(names).toEqual(sortedNames);
      });

      it('should return empty array when no cinemas match status', async () => {
        // Arrange - Delete all closed cinemas
        await ctx.prisma.cinemas.deleteMany({ where: { status: 'CLOSED' } });
        await ctx.prisma.cinemas.createMany({
          data: [
            {
              name: 'Only Active',
              address: 'Addr',
              city: 'City',
              status: 'ACTIVE',
            },
          ],
        });
        await ctx.prisma.cinemas.deleteMany({ where: { status: 'CLOSED' } });

        // Act
        const result = await ctx.cinemaController.getAllCinemas(
          CinemaStatusEnum.CLOSED
        );

        // Assert
        expect(result.data).toEqual([]);
        expect(result.message).toBe('Get all cinemas successfully!');
      });
    });
  });

  // ============================================================================
  // 1.5 getMoviesByCinema (requires mocked MOVIE_SERVICE)
  // ============================================================================

  describe('1.5 getMoviesByCinema', () => {
    let testCinemaId: string;

    beforeEach(async () => {
      // Create a cinema
      const cinemaResult = await ctx.cinemaController.createCinema(
        createTestCinemaRequest({ name: 'Cinema With Movies' }) as any
      );
      testCinemaId = cinemaResult.data.id;

      // Reset mock calls
      ctx.mockMovieClient.send.mockClear();
    });

    describe('Success Scenarios', () => {
      it('should return empty data when cinema has no showtimes', async () => {
        // Act
        const result = await ctx.cinemaController.getMoviesByCinema({
          cinemaId: testCinemaId,
          query: { page: 1, limit: 10 },
        });

        // Assert
        expect(result.data).toEqual([]);
        expect(result.meta).toMatchObject({
          page: 1,
          limit: 10,
          totalRecords: 0,
          totalPages: 0,
        });

        // Movie service should NOT be called when no showtimes
        expect(ctx.mockMovieClient.send).not.toHaveBeenCalled();
      });

      it('should handle pagination correctly', async () => {
        // Act
        const result = await ctx.cinemaController.getMoviesByCinema({
          cinemaId: testCinemaId,
          query: { page: 1, limit: 5 },
        });

        // Assert meta structure
        expect(result.meta).toHaveProperty('page', 1);
        expect(result.meta).toHaveProperty('limit', 5);
        expect(result.meta).toHaveProperty('hasPrev', false);
        expect(result.meta).toHaveProperty('hasNext');
      });
    });

    describe('With Showtimes', () => {
      beforeEach(async () => {
        // Create a hall
        const hall = await ctx.prisma.halls.create({
          data: {
            cinema_id: testCinemaId,
            name: 'Hall 1',
            type: 'STANDARD',
            capacity: 100,
            rows: 10,
            status: 'ACTIVE',
          },
        });

        // Create a showtime in the future with SELLING status
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        await ctx.prisma.showtimes.create({
          data: {
            cinema_id: testCinemaId,
            hall_id: hall.id,
            movie_id: '00000000-0000-0000-0000-000000000001',
            movie_release_id: '00000000-0000-0000-0000-000000000001',
            start_time: futureDate,
            end_time: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
            status: 'SELLING' as any,
            format: 'TWO_D' as any,
            language: 'Vietnamese',
            total_seats: 100,
            available_seats: 100,
            day_type: 'WEEKDAY' as any,
          } as any,
        });

        // Mock movie service response
        ctx.mockMovieClient.send.mockImplementation(() =>
          require('rxjs').of([
            {
              id: '00000000-0000-0000-0000-000000000001',
              title: 'Test Movie',
              duration: 120,
              posterUrl: 'https://example.com/poster.jpg',
            },
          ])
        );
      });

      it('should return movies with showtimes and call movie service', async () => {
        // Act
        const result = await ctx.cinemaController.getMoviesByCinema({
          cinemaId: testCinemaId,
          query: { page: 1, limit: 10 },
        });

        // Assert
        expect(result.data.length).toBeGreaterThan(0);
        expect(ctx.mockMovieClient.send).toHaveBeenCalled();
        expect(result.message).toBe('Get movies successfully!');
      });
    });
  });

  // ============================================================================
  // 1.6 getAllMoviesWithShowtimes (requires mocked MOVIE_SERVICE)
  // ============================================================================

  describe('1.6 getAllMoviesWithShowtimes', () => {
    beforeEach(() => {
      ctx.mockMovieClient.send.mockClear();
    });

    describe('Success Scenarios', () => {
      it('should return empty array when no showtimes exist for date', async () => {
        // Act
        const result = await ctx.cinemaController.getAllMoviesAtCinemas({
          date: '2099-12-31', // Far future date with no showtimes
        });

        // Assert
        expect(result.data).toEqual([]);
        expect(result.message).toBe('Get movies successfully!');
      });

      it('should use today as default date when not provided', async () => {
        // Act
        const result = await ctx.cinemaController.getAllMoviesAtCinemas({});

        // Assert - Should not throw and return valid response
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('message');
      });
    });
  });
});
