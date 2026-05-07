/**
 * Cinema Location Module Integration Tests
 *
 * Tests the Cinema Location operations:
 * - getCinemasNearby
 * - getCinemasWithFilters
 * - getCinemaDetail
 * - searchCinemas
 * - getAvailableCities
 * - getAvailableDistricts
 *
 * @see test/docs/CINEMA_SERVICE_INTEGRATION_TEST_DOCS.md Section 2
 */

import {
  CinemaTestContext,
  createCinemaTestingModule,
  cleanupCinemaTestData,
  closeCinemaTestContext,
  createTestCinemaRequest,
} from './helpers/cinema-test-helpers';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('Cinema Location Module Integration Tests', () => {
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
  // 2.1 getCinemasNearby
  // ============================================================================

  describe('2.1 getCinemasNearby', () => {
    beforeEach(async () => {
      // Create test cinemas at different locations
      await ctx.prisma.cinemas.createMany({
        data: [
          {
            name: 'CGV Vincom Center',
            address: '72 Le Thanh Ton, D1',
            city: 'Ho Chi Minh City',
            latitude: 10.7751,
            longitude: 106.7011,
            status: 'ACTIVE',
          },
          {
            name: 'Galaxy Cinema',
            address: '116 Nguyen Du, D1',
            city: 'Ho Chi Minh City',
            latitude: 10.7769,
            longitude: 106.6926,
            status: 'ACTIVE',
          },
          {
            name: 'BHD Star Bitexco',
            address: 'Bitexco Tower',
            city: 'Ho Chi Minh City',
            latitude: 10.7719,
            longitude: 106.7042,
            status: 'ACTIVE',
          },
          {
            name: 'Far Away Cinema',
            address: 'Da Nang',
            city: 'Da Nang',
            latitude: 16.0544,
            longitude: 108.2022,
            status: 'ACTIVE',
          },
          {
            name: 'Inactive Cinema',
            address: 'Nearby but inactive',
            city: 'Ho Chi Minh City',
            latitude: 10.7750,
            longitude: 106.7000,
            status: 'MAINTENANCE',
          },
        ],
      });
    });

    describe('Success Scenarios', () => {
      it('should find cinemas within 10km radius', async () => {
        // Arrange - Location near District 1 HCMC
        const userLat = 10.7758;
        const userLong = 106.7010;

        // Act
        const result = await ctx.cinemaLocationController.getCinemasNearby({
          latitude: userLat,
          longitude: userLong,
          radiusKm: 10,
          limit: 20,
        });

        // Assert
        expect(result.message).toBe('Get nearby cinemas successfully!');
        expect(result.data.cinemas.length).toBeGreaterThan(0);
        expect(result.data.cinemas.length).toBeLessThanOrEqual(3); // Only ACTIVE, within radius

        // Should not include far away cinema
        const names = result.data.cinemas.map((c) => c.name);
        expect(names).not.toContain('Far Away Cinema');
        expect(names).not.toContain('Inactive Cinema');
      });

      it('should return cinemas sorted by distance', async () => {
        // Arrange
        const userLat = 10.7751;
        const userLong = 106.7011; // Same as CGV Vincom

        // Act
        const result = await ctx.cinemaLocationController.getCinemasNearby({
          latitude: userLat,
          longitude: userLong,
          radiusKm: 10,
        });

        // Assert - First cinema should be the closest
        if (result.data.cinemas.length >= 2) {
          const distances = result.data.cinemas.map((c) => c.location.distance || 0);
          for (let i = 1; i < distances.length; i++) {
            expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
          }
        }
      });

      it('should return empty array when no cinemas within radius', async () => {
        // Arrange - Location far from all cinemas
        const result = await ctx.cinemaLocationController.getCinemasNearby({
          latitude: 0,
          longitude: 0,
          radiusKm: 1,
        });

        // Assert
        expect(result.data.cinemas).toEqual([]);
        expect(result.data.total).toBe(0);
      });

      it('should respect the limit parameter', async () => {
        // Act
        const result = await ctx.cinemaLocationController.getCinemasNearby({
          latitude: 10.7758,
          longitude: 106.7010,
          radiusKm: 100,
          limit: 2,
        });

        // Assert
        expect(result.data.cinemas.length).toBeLessThanOrEqual(2);
        expect(result.data.limit).toBe(2);
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw BadRequestException when latitude is missing', async () => {
        // Act & Assert
        await expect(
          ctx.cinemaLocationController.getCinemasNearby({
            latitude: undefined as any,
            longitude: 106.7010,
          })
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when longitude is missing', async () => {
        // Act & Assert
        await expect(
          ctx.cinemaLocationController.getCinemasNearby({
            latitude: 10.7758,
            longitude: undefined as any,
          })
        ).rejects.toThrow(BadRequestException);
      });
    });
  });

  // ============================================================================
  // 2.2 getCinemasWithFilters
  // ============================================================================

  describe('2.2 getCinemasWithFilters', () => {
    beforeEach(async () => {
      // Create test cinemas with various attributes
      const cinema1 = await ctx.prisma.cinemas.create({
        data: {
          name: 'Premium Cinema District 1',
          address: 'Address 1',
          city: 'Ho Chi Minh City',
          district: 'District 1',
          rating: 4.5,
          amenities: ['parking', 'wifi', 'VIP lounge'],
          status: 'ACTIVE',
          latitude: 10.7751,
          longitude: 106.7011,
        },
      });

      const cinema2 = await ctx.prisma.cinemas.create({
        data: {
          name: 'Budget Cinema District 7',
          address: 'Address 2',
          city: 'Ho Chi Minh City',
          district: 'District 7',
          rating: 3.5,
          amenities: ['parking'],
          status: 'ACTIVE',
          latitude: 10.735,
          longitude: 106.700,
        },
      });

      const cinema3 = await ctx.prisma.cinemas.create({
        data: {
          name: 'Hanoi Cinema',
          address: 'Address 3',
          city: 'Hanoi',
          district: 'Hoan Kiem',
          rating: 4.0,
          amenities: ['wifi', 'food court'],
          status: 'ACTIVE',
        },
      });

      // Create IMAX hall for cinema1
      await ctx.prisma.halls.create({
        data: {
          cinema_id: cinema1.id,
          name: 'IMAX Hall',
          type: 'IMAX',
          capacity: 200,
          rows: 15,
          status: 'ACTIVE',
        },
      });

      // Create VIP hall for cinema2
      await ctx.prisma.halls.create({
        data: {
          cinema_id: cinema2.id,
          name: 'VIP Hall',
          type: 'VIP',
          capacity: 50,
          rows: 5,
          status: 'ACTIVE',
        },
      });
    });

    describe('Success Scenarios', () => {
      it('should filter cinemas by city', async () => {
        // Act
        const result = await ctx.cinemaLocationController.getCinemasWithFilters({
          city: 'Ho Chi Minh City',
        });

        // Assert
        expect(result.message).toBe('Get cinemas with filters successfully!');
        expect(result.data.cinemas.length).toBe(2);
        result.data.cinemas.forEach((cinema) => {
          expect(cinema.city?.toLowerCase()).toContain('ho chi minh');
        });
      });

      it('should filter cinemas by amenities (must have ALL)', async () => {
        // Act - Only cinema1 has both parking AND wifi
        const result = await ctx.cinemaLocationController.getCinemasWithFilters({
          amenities: ['parking', 'wifi'],
        });

        // Assert
        expect(result.data.cinemas.length).toBe(1);
        expect(result.data.cinemas[0].name).toBe('Premium Cinema District 1');
      });

      it('should filter cinemas by IMAX hall type', async () => {
        // Act
        const result = await ctx.cinemaLocationController.getCinemasWithFilters({
          hallTypes: ['IMAX'],
        });

        // Assert
        expect(result.data.cinemas.length).toBe(1);
        expect(result.data.cinemas[0].name).toBe('Premium Cinema District 1');
      });

      it('should sort by rating descending', async () => {
        // Act
        const result = await ctx.cinemaLocationController.getCinemasWithFilters({
          sortBy: 'rating',
          sortOrder: 'desc',
        });

        // Assert
        const ratings = result.data.cinemas.map((c) => c.rating || 0);
        for (let i = 1; i < ratings.length; i++) {
          expect(ratings[i]).toBeLessThanOrEqual(ratings[i - 1]);
        }
      });

      it('should return empty array when no matching filters', async () => {
        // Act
        const result = await ctx.cinemaLocationController.getCinemasWithFilters({
          city: 'Nonexistent City',
        });

        // Assert
        expect(result.data.cinemas).toEqual([]);
        expect(result.data.total).toBe(0);
      });

      it('should handle pagination correctly', async () => {
        // Act
        const result = await ctx.cinemaLocationController.getCinemasWithFilters({
          page: 1,
          limit: 1,
        });

        // Assert
        expect(result.data.cinemas.length).toBe(1);
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(1);
        expect(result.data.hasMore).toBe(true);
      });
    });
  });

  // ============================================================================
  // 2.3 getCinemaDetail
  // ============================================================================

  describe('2.3 getCinemaDetail', () => {
    let testCinemaId: string;

    beforeEach(async () => {
      // Create a cinema with halls
      const cinema = await ctx.prisma.cinemas.create({
        data: {
          name: 'Test Cinema',
          address: '123 Test Street',
          city: 'Ho Chi Minh City',
          district: 'District 1',
          latitude: 10.7751,
          longitude: 106.7011,
          status: 'ACTIVE',
          amenities: ['parking', 'wifi'],
        },
      });
      testCinemaId = cinema.id;

      // Create halls for the cinema
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
            name: 'Hall 2 VIP',
            type: 'VIP',
            capacity: 50,
            rows: 5,
            status: 'ACTIVE',
          },
        ],
      });
    });

    describe('Success Scenarios', () => {
      it('should return full cinema info with halls', async () => {
        // Act
        const result = await ctx.cinemaLocationController.getCinemaDetail({
          cinemaId: testCinemaId,
        });

        // Assert
        expect(result.message).toBe('Get cinema detail successfully!');
        expect(result.data.id).toBe(testCinemaId);
        expect(result.data.name).toBe('Test Cinema');
        expect(result.data.totalHalls).toBe(2);
      });

      it('should calculate distance when user location provided', async () => {
        // Act
        const result = await ctx.cinemaLocationController.getCinemaDetail({
          cinemaId: testCinemaId,
          userLatitude: 10.78,
          userLongitude: 106.7,
        });

        // Assert
        expect(result.data.location.distance).toBeDefined();
        expect(typeof result.data.location.distance).toBe('number');
      });

      it('should return cinema without distance when no user location', async () => {
        // Act
        const result = await ctx.cinemaLocationController.getCinemaDetail({
          cinemaId: testCinemaId,
        });

        // Assert
        expect(result.data.location.distance).toBeUndefined();
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw NotFoundException for non-existent cinema', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.cinemaLocationController.getCinemaDetail({ cinemaId: nonExistentId })
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  // ============================================================================
  // 2.4 searchCinemas
  // ============================================================================

  describe('2.4 searchCinemas', () => {
    beforeEach(async () => {
      await ctx.prisma.cinemas.createMany({
        data: [
          {
            name: 'CGV Vincom Center',
            address: '72 Le Thanh Ton',
            city: 'Ho Chi Minh City',
            status: 'ACTIVE',
          },
          {
            name: 'Galaxy Cinema Nguyen Du',
            address: '116 Nguyen Du',
            city: 'Ho Chi Minh City',
            status: 'ACTIVE',
          },
          {
            name: 'Lotte Cinema Hanoi',
            address: '54 Lieu Giai',
            city: 'Hanoi',
            status: 'ACTIVE',
          },
          {
            name: 'Inactive CGV',
            address: 'Somewhere',
            city: 'Ho Chi Minh City',
            status: 'CLOSED',
          },
        ],
      });
    });

    describe('Success Scenarios', () => {
      it('should search by partial cinema name', async () => {
        // Act
        const result = await ctx.cinemaLocationController.searchCinemas({
          query: 'CGV',
        });

        // Assert - Only active CGV should be returned
        expect(result.message).toBe('Search cinemas successfully!');
        expect(result.data.length).toBe(1);
        expect(result.data[0].name).toContain('CGV');
      });

      it('should search by city name', async () => {
        // Act
        const result = await ctx.cinemaLocationController.searchCinemas({
          query: 'Hanoi',
        });

        // Assert
        expect(result.data.length).toBe(1);
        expect(result.data[0].name).toBe('Lotte Cinema Hanoi');
      });

      it('should search by address (case-insensitive)', async () => {
        // Act
        const result = await ctx.cinemaLocationController.searchCinemas({
          query: 'nguyen du',
        });

        // Assert
        expect(result.data.length).toBe(1);
        expect(result.data[0].name).toContain('Galaxy');
      });

      it('should return empty array when no matches', async () => {
        // Act
        const result = await ctx.cinemaLocationController.searchCinemas({
          query: 'NonexistentCinema123',
        });

        // Assert
        expect(result.data).toEqual([]);
      });

      it('should limit results to 20', async () => {
        // Act - with any general query
        const result = await ctx.cinemaLocationController.searchCinemas({
          query: 'Cinema',
        });

        // Assert
        expect(result.data.length).toBeLessThanOrEqual(20);
      });
    });
  });

  // ============================================================================
  // 2.5 getAvailableCities
  // ============================================================================

  describe('2.5 getAvailableCities', () => {
    beforeEach(async () => {
      await ctx.prisma.cinemas.createMany({
        data: [
          { name: 'Cinema 1', address: 'Addr 1', city: 'Ho Chi Minh City', status: 'ACTIVE' },
          { name: 'Cinema 2', address: 'Addr 2', city: 'Ho Chi Minh City', status: 'ACTIVE' },
          { name: 'Cinema 3', address: 'Addr 3', city: 'Hanoi', status: 'ACTIVE' },
          { name: 'Cinema 4', address: 'Addr 4', city: 'Da Nang', status: 'ACTIVE' },
          { name: 'Closed Cinema', address: 'Addr 5', city: 'Can Tho', status: 'CLOSED' },
        ],
      });
    });

    describe('Success Scenarios', () => {
      it('should return distinct city names from active cinemas', async () => {
        // Act
        const result = await ctx.cinemaLocationController.getAvailableCities();

        // Assert
        expect(result.message).toBe('Get available cities successfully!');
        expect(result.data).toBeInstanceOf(Array);
        expect(result.data.length).toBe(3); // HCMC, Hanoi, Da Nang (not Can Tho - closed)

        // Should not include closed cinema's city
        expect(result.data).not.toContain('Can Tho');
      });

      it('should return cities in ascending order', async () => {
        // Act
        const result = await ctx.cinemaLocationController.getAvailableCities();

        // Assert
        const sortedCities = [...result.data].sort();
        expect(result.data).toEqual(sortedCities);
      });

      it('should return empty array when no active cinemas', async () => {
        // Arrange - Delete all and create only inactive
        await ctx.prisma.cinemas.deleteMany();
        await ctx.prisma.cinemas.create({
          data: { name: 'Closed', address: 'Addr', city: 'City', status: 'CLOSED' },
        });

        // Act
        const result = await ctx.cinemaLocationController.getAvailableCities();

        // Assert
        expect(result.data).toEqual([]);
      });
    });
  });

  // ============================================================================
  // 2.6 getAvailableDistricts
  // ============================================================================

  describe('2.6 getAvailableDistricts', () => {
    beforeEach(async () => {
      await ctx.prisma.cinemas.createMany({
        data: [
          { name: 'C1', address: 'A1', city: 'Ho Chi Minh City', district: 'District 1', status: 'ACTIVE' },
          { name: 'C2', address: 'A2', city: 'Ho Chi Minh City', district: 'District 7', status: 'ACTIVE' },
          { name: 'C3', address: 'A3', city: 'Ho Chi Minh City', district: 'District 1', status: 'ACTIVE' },
          { name: 'C4', address: 'A4', city: 'Ho Chi Minh City', district: null, status: 'ACTIVE' },
          { name: 'C5', address: 'A5', city: 'Hanoi', district: 'Hoan Kiem', status: 'ACTIVE' },
          { name: 'C6', address: 'A6', city: 'Ho Chi Minh City', district: 'Binh Thanh', status: 'CLOSED' },
        ],
      });
    });

    describe('Success Scenarios', () => {
      it('should return distinct districts for given city', async () => {
        // Act
        const result = await ctx.cinemaLocationController.getAvailableDistricts({
          city: 'Ho Chi Minh City',
        });

        // Assert
        expect(result.message).toBe('Get available districts successfully!');
        expect(result.data).toEqual(expect.arrayContaining(['District 1', 'District 7']));
        expect(result.data.length).toBe(2); // District 1 and District 7 (Binh Thanh is closed, null is filtered)
      });

      it('should filter out null districts', async () => {
        // Act
        const result = await ctx.cinemaLocationController.getAvailableDistricts({
          city: 'Ho Chi Minh City',
        });

        // Assert
        expect(result.data).not.toContain(null);
      });

      it('should return empty array for city with no cinemas', async () => {
        // Act
        const result = await ctx.cinemaLocationController.getAvailableDistricts({
          city: 'Nonexistent City',
        });

        // Assert
        expect(result.data).toEqual([]);
      });

      it('should be case-insensitive for city matching', async () => {
        // Act
        const result = await ctx.cinemaLocationController.getAvailableDistricts({
          city: 'ho chi minh city',
        });

        // Assert
        expect(result.data.length).toBeGreaterThan(0);
      });
    });
  });
});
