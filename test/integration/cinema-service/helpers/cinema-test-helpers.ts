/**
 * Cinema Service Integration Test Helpers
 *
 * This file provides utilities for setting up and tearing down integration tests
 * for the cinema-service microservice.
 *
 * Key principles:
 * - Use REAL PostgreSQL database (no mocking of PrismaService)
 * - Mock external services (RPC clients, Redis Pub/Sub)
 * - Inject controllers directly for TCP microservice testing
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../../../apps/cinema-service/src/app/prisma.service';
import { CinemaController } from '../../../../apps/cinema-service/src/app/cinema/cinema.controller';
import { CinemaService } from '../../../../apps/cinema-service/src/app/cinema/cinema.service';
import { CinemaLocationController } from '../../../../apps/cinema-service/src/app/cinema-location/cinema-location.controller';
import { CinemaLocationService } from '../../../../apps/cinema-service/src/app/cinema-location/cinema-location.service';
import { CinemaLocationMapper } from '../../../../apps/cinema-service/src/app/cinema-location/cinema-location.mapper';
import { HallController } from '../../../../apps/cinema-service/src/app/hall/hall.controller';
import { HallService } from '../../../../apps/cinema-service/src/app/hall/hall.service';
import { ShowtimeController } from '../../../../apps/cinema-service/src/app/showtime/showtime.controller';
import { ShowtimeService } from '../../../../apps/cinema-service/src/app/showtime/showtime.service';
import { ShowtimeCommandService } from '../../../../apps/cinema-service/src/app/showtime/showtime-command.service';
import { ShowtimeMapper } from '../../../../apps/cinema-service/src/app/showtime/showtime.mapper';
import { ShowtimeSeatMapper } from '../../../../apps/cinema-service/src/app/showtime/showtime-seat.mapper';
import { RealtimeService } from '../../../../apps/cinema-service/src/app/realtime/realtime.service';
import { ResolveBookingService } from '../../../../apps/cinema-service/src/app/realtime/resolve-booking.service';
import { ConfigModule } from '@nestjs/config';
import { of } from 'rxjs';

// ============================================================================
// MOCK PROVIDERS
// ============================================================================

/**
 * Mock for MOVIE_SERVICE RPC Client
 * Used for mocking inter-service communication
 */
export const createMockMovieClient = () => ({
  send: jest.fn().mockImplementation((pattern: string, data: any) => {
    if (pattern === 'movie.detail') {
      return of({
        data: {
          id: data,
          title: 'Mock Movie',
          runtime: 120,
        },
      });
    }
    if (pattern === 'movie.release.list') {
      return of({
        data: [
          {
            id: '00000000-0000-0000-0000-000000000002',
            movieId: data,
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        ],
      });
    }
    return of({ data: [] });
  }),
  emit: jest.fn().mockImplementation(() => of(undefined)),
});

/**
 * Mock for Redis Pub/Sub Service (REDIS_CINEMA)
 * Used for mocking real-time seat management
 */
export const createMockRedisPubSubService = () => ({
  subscribe: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue(undefined),
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  keys: jest.fn().mockResolvedValue([]),
  smembers: jest.fn().mockResolvedValue([]),
  sadd: jest.fn().mockResolvedValue(1),
  srem: jest.fn().mockResolvedValue(1),
  scard: jest.fn().mockResolvedValue(0),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-2),
  pipeline: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }),
  flushByPrefix: jest.fn().mockResolvedValue(undefined),
  quitAll: jest.fn().mockResolvedValue(undefined),
});

/**
 * Mock for RealtimeService
 * Provides stubs for all real-time seat management methods
 */
export const createMockRealtimeService = () => ({
  getAllHeldSeats: jest.fn().mockResolvedValue({}),
  getUserHeldSeats: jest.fn().mockResolvedValue([]),
  hasHeldSeats: jest.fn().mockResolvedValue(false),
  getUserTTL: jest.fn().mockResolvedValue(-2),
  getOrSetCache: jest
    .fn()
    .mockImplementation((_key, _ttl, fetchFn) => fetchFn()),
  deleteCacheByPrefix: jest.fn().mockResolvedValue(undefined),
  onModuleInit: jest.fn().mockResolvedValue(undefined),
  onModuleDestroy: jest.fn().mockResolvedValue(undefined),
});

// ============================================================================
// TEST MODULE BUILDER
// ============================================================================

export interface CinemaTestContext {
  app: INestApplication;
  module: TestingModule;
  prisma: PrismaService;
  cinemaController: CinemaController;
  cinemaLocationController: CinemaLocationController;
  hallController: HallController;
  showtimeController: ShowtimeController;
  mockMovieClient: ReturnType<typeof createMockMovieClient>;
  mockRealtimeService: ReturnType<typeof createMockRealtimeService>;
}

/**
 * Creates a testing module for cinema-service integration tests
 * - Uses real PrismaService for database operations
 * - Mocks external services (MOVIE_SERVICE, Redis)
 */
export async function createCinemaTestingModule(): Promise<CinemaTestContext> {
  const mockMovieClient = createMockMovieClient();
  const mockRealtimeService = createMockRealtimeService();
  const mockRedisPubSub = createMockRedisPubSubService();

  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        // Use test environment variables
        envFilePath: ['.env.test', '.env'],
        ignoreEnvFile: false,
      }),
    ],
    controllers: [
      CinemaController,
      CinemaLocationController,
      HallController,
      ShowtimeController,
    ],
    providers: [
      // Core services
      PrismaService,

      // Cinema module
      CinemaService,

      // Cinema Location module
      CinemaLocationService,
      CinemaLocationMapper,

      // Hall module
      HallService,

      // Showtime module
      ShowtimeService,
      ShowtimeCommandService,
      ShowtimeMapper,
      ShowtimeSeatMapper,
      ResolveBookingService,

      // External service mocks
      {
        provide: 'MOVIE_SERVICE',
        useValue: mockMovieClient,
      },
      {
        provide: 'REDIS_CINEMA',
        useValue: mockRedisPubSub,
      },
      {
        provide: RealtimeService,
        useValue: mockRealtimeService,
      },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const prisma = moduleRef.get<PrismaService>(PrismaService);

  return {
    app,
    module: moduleRef,
    prisma,
    cinemaController: moduleRef.get<CinemaController>(CinemaController),
    cinemaLocationController: moduleRef.get<CinemaLocationController>(
      CinemaLocationController
    ),
    hallController: moduleRef.get<HallController>(HallController),
    showtimeController: moduleRef.get<ShowtimeController>(ShowtimeController),
    mockMovieClient,
    mockRealtimeService,
  };
}

// ============================================================================
// DATABASE CLEANUP UTILITIES
// ============================================================================

/**
 * Cleans up all cinema-related test data from the database
 * Order matters due to foreign key constraints
 */
export async function cleanupCinemaTestData(
  prisma: PrismaService
): Promise<void> {
  try {
    // Delete in reverse order of dependencies
    await prisma.seatReservations.deleteMany({});
    await prisma.showtimes.deleteMany({});
    await prisma.ticketPricing.deleteMany({});
    await prisma.seats.deleteMany({});
    await prisma.halls.deleteMany({});
    await prisma.cinemaReviews.deleteMany({});
    await prisma.cinemas.deleteMany({});
  } catch (error) {
    console.warn('Cleanup failed (some tables may not exist):', error);
  }
}

/**
 * Cleanup only cinema records (for isolated cinema tests)
 */
export async function cleanupCinemasOnly(prisma: PrismaService): Promise<void> {
  try {
    // First remove dependent records
    await prisma.seatReservations.deleteMany({});
    await prisma.showtimes.deleteMany({});
    await prisma.ticketPricing.deleteMany({});
    await prisma.seats.deleteMany({});
    await prisma.halls.deleteMany({});
    await prisma.cinemaReviews.deleteMany({});
    await prisma.cinemas.deleteMany({});
  } catch (error) {
    console.warn('Cinema cleanup failed:', error);
  }
}

/**
 * Cleanup halls and their dependent records
 */
export async function cleanupHalls(
  prisma: PrismaService,
  cinemaId?: string
): Promise<void> {
  try {
    const whereClause = cinemaId ? { cinema_id: cinemaId } : {};

    // Get hall IDs first
    const halls = await prisma.halls.findMany({
      where: whereClause,
      select: { id: true },
    });
    const hallIds = halls.map((h) => h.id);

    if (hallIds.length > 0) {
      await prisma.seatReservations.deleteMany({
        where: { showtime: { hall_id: { in: hallIds } } },
      });
      await prisma.showtimes.deleteMany({
        where: { hall_id: { in: hallIds } },
      });
      await prisma.ticketPricing.deleteMany({
        where: { hall_id: { in: hallIds } },
      });
      await prisma.seats.deleteMany({
        where: { hall_id: { in: hallIds } },
      });
      await prisma.halls.deleteMany({
        where: { id: { in: hallIds } },
      });
    }
  } catch (error) {
    console.warn('Hall cleanup failed:', error);
  }
}

/**
 * Cleanup showtimes and their reservations
 */
export async function cleanupShowtimes(
  prisma: PrismaService,
  cinemaId?: string
): Promise<void> {
  try {
    const whereClause = cinemaId ? { cinema_id: cinemaId } : {};

    await prisma.seatReservations.deleteMany({
      where: { showtime: whereClause },
    });
    await prisma.showtimes.deleteMany({
      where: whereClause,
    });
  } catch (error) {
    console.warn('Showtime cleanup failed:', error);
  }
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

/**
 * Creates a minimal valid cinema request for testing
 */
export function createTestCinemaRequest(
  overrides: Partial<CreateCinemaTestData> = {}
): CreateCinemaTestData {
  return {
    name: `Test Cinema ${Date.now()}`,
    address: '123 Test Street, Test District',
    city: 'Ho Chi Minh City',
    district: 'District 1',
    phone: '0901234567',
    email: 'test@cinema.com',
    latitude: 10.8231,
    longitude: 106.6297,
    amenities: ['parking', 'wifi'],
    images: [],
    timezone: 'Asia/Ho_Chi_Minh',
    ...overrides,
  };
}

export interface CreateCinemaTestData {
  name: string;
  address: string;
  city: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  amenities: string[];
  facilities?: Record<string, unknown>;
  images: string[];
  virtualTour360Url?: string;
  timezone: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';
}

/**
 * Creates a minimal valid hall request for testing
 */
export function createTestHallRequest(
  cinemaId: string,
  overrides: Partial<CreateHallTestData> = {}
): CreateHallTestData {
  return {
    cinemaId,
    name: `Hall ${Date.now()}`,
    type: 'STANDARD',
    capacity: 100,
    rows: 10,
    screenType: 'Standard',
    soundSystem: 'Dolby Digital',
    features: ['3D Ready'],
    layoutType: 'STANDARD',
    ...overrides,
  };
}

export interface CreateHallTestData {
  cinemaId: string;
  name: string;
  type: 'STANDARD' | 'VIP' | 'IMAX' | 'FOUR_DX' | 'PREMIUM';
  capacity: number;
  rows: number;
  screenType?: string;
  soundSystem?: string;
  features: string[];
  layoutType?: 'STANDARD' | 'DUAL_AISLE' | 'STADIUM';
}

/**
 * Creates a minimal valid showtime request for testing
 */
export function createTestShowtimeRequest(
  movieId: string,
  movieReleaseId: string,
  cinemaId: string,
  hallId: string,
  overrides: Partial<CreateShowtimeTestData> = {}
): CreateShowtimeTestData {
  const startTime = new Date();
  startTime.setHours(startTime.getHours() + 2); // 2 hours from now

  return {
    movieId,
    movieReleaseId,
    cinemaId,
    hallId,
    startTime: startTime.toISOString(),
    format: 'TWO_D',
    language: 'Vietnamese',
    subtitles: ['English'],
    ...overrides,
  };
}

export interface CreateShowtimeTestData {
  movieId: string;
  movieReleaseId: string;
  cinemaId: string;
  hallId: string;
  startTime: string;
  format: 'TWO_D' | 'THREE_D' | 'IMAX' | 'FOUR_DX';
  language: string;
  subtitles?: string[];
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Verifies that a cinema was persisted correctly in the database
 */
export async function verifyCinemaPersisted(
  prisma: PrismaService,
  cinemaId: string,
  expectedData: Partial<CreateCinemaTestData>
): Promise<void> {
  const cinema = await prisma.cinemas.findUnique({
    where: { id: cinemaId },
  });

  expect(cinema).not.toBeNull();
  expect(cinema?.name).toBe(expectedData.name);
  expect(cinema?.address).toBe(expectedData.address);
  expect(cinema?.city).toBe(expectedData.city);

  if (expectedData.district) {
    expect(cinema?.district).toBe(expectedData.district);
  }

  // Verify timestamps are set
  expect(cinema?.created_at).toBeInstanceOf(Date);
  expect(cinema?.updated_at).toBeInstanceOf(Date);
}

/**
 * Verifies that a hall was persisted correctly with seats and pricing
 */
export async function verifyHallPersisted(
  prisma: PrismaService,
  hallId: string,
  expectedData: Partial<CreateHallTestData>
): Promise<void> {
  const hall = await prisma.halls.findUnique({
    where: { id: hallId },
    include: {
      seats: true,
    },
  });

  expect(hall).not.toBeNull();
  expect(hall?.seats.length).toBeGreaterThan(0);
}

// ============================================================================
// TEARDOWN UTILITY
// ============================================================================

/**
 * Properly closes the test context to prevent Jest hangs
 */
export async function closeCinemaTestContext(
  context: CinemaTestContext
): Promise<void> {
  try {
    await context.prisma.$disconnect();
    await context.app.close();
  } catch (error) {
    console.warn('Error during test context cleanup:', error);
  }
}
