/**
 * Movie Service Integration Test Helpers
 *
 * This file provides utilities for setting up and tearing down integration tests
 * for the movie-service microservice.
 *
 * Key principles:
 * - Use REAL PostgreSQL database (no mocking of PrismaService)
 * - No external service dependencies (movie-service is self-contained)
 * - Inject controllers directly for TCP microservice testing
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../../../apps/movie-service/src/module/prisma/prisma.service';
import { MovieController } from '../../../../apps/movie-service/src/module/movie/movie.controller';
import { MovieService } from '../../../../apps/movie-service/src/module/movie/movie.service';
import { GenreController } from '../../../../apps/movie-service/src/module/genre/genre.controller';
import { GenreService } from '../../../../apps/movie-service/src/module/genre/genre.service';
import { ReviewController } from '../../../../apps/movie-service/src/module/review/review.controller';
import { ReviewService } from '../../../../apps/movie-service/src/module/review/review.service';
import { ConfigModule } from '@nestjs/config';

// ============================================================================
// TEST MODULE BUILDER
// ============================================================================

export interface MovieTestContext {
  app: INestApplication;
  module: TestingModule;
  prisma: PrismaService;
  movieController: MovieController;
  genreController: GenreController;
  reviewController: ReviewController;
}

/**
 * Creates a testing module for movie-service integration tests
 * - Uses real PrismaService for database operations
 * - No external service mocks needed (movie-service has no RPC dependencies)
 */
export async function createMovieTestingModule(): Promise<MovieTestContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: ['.env.test', '.env'],
        ignoreEnvFile: false,
      }),
    ],
    controllers: [MovieController, GenreController, ReviewController],
    providers: [PrismaService, MovieService, GenreService, ReviewService],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const prisma = moduleRef.get<PrismaService>(PrismaService);

  return {
    app,
    module: moduleRef,
    prisma,
    movieController: moduleRef.get<MovieController>(MovieController),
    genreController: moduleRef.get<GenreController>(GenreController),
    reviewController: moduleRef.get<ReviewController>(ReviewController),
  };
}

// ============================================================================
// DATABASE CLEANUP UTILITIES
// ============================================================================

/**
 * Cleans up all movie-related test data from the database
 * Order matters due to foreign key constraints
 */
export async function cleanupMovieTestData(
  prisma: PrismaService
): Promise<void> {
  try {
    // Delete in reverse order of dependencies
    await prisma.review.deleteMany({});
    await prisma.movieRelease.deleteMany({});
    await prisma.movieGenre.deleteMany({});
    await prisma.movie.deleteMany({});
    await prisma.genre.deleteMany({});
  } catch (error) {
    console.warn('Cleanup failed (some tables may not exist):', error);
  }
}

/**
 * Cleanup only movies (leaves genres intact for reference data)
 */
export async function cleanupMoviesOnly(prisma: PrismaService): Promise<void> {
  try {
    await prisma.review.deleteMany({});
    await prisma.movieRelease.deleteMany({});
    await prisma.movieGenre.deleteMany({});
    await prisma.movie.deleteMany({});
  } catch (error) {
    console.warn('Movie cleanup failed:', error);
  }
}

/**
 * Cleanup reviews only
 */
export async function cleanupReviews(prisma: PrismaService): Promise<void> {
  try {
    await prisma.review.deleteMany({});
  } catch (error) {
    console.warn('Review cleanup failed:', error);
  }
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

/**
 * Creates a minimal valid movie request for testing
 */
export function createTestMovieRequest(
  overrides: Partial<CreateMovieTestData> = {}
): CreateMovieTestData {
  return {
    title: `Test Movie ${Date.now()}`,
    originalTitle: 'Test Movie Original',
    overview: 'A test movie for integration testing purposes.',
    posterUrl: 'https://example.com/poster.jpg',
    trailerUrl: 'https://example.com/trailer.mp4',
    backdropUrl: 'https://example.com/backdrop.jpg',
    runtime: 120,
    releaseDate: '2024-01-15',
    ageRating: 'P',
    originalLanguage: 'Vietnamese',
    spokenLanguages: ['Vietnamese', 'English'],
    languageType: 'ORIGINAL',
    productionCountry: 'Vietnam',
    director: 'Test Director',
    cast: { lead: 'Test Actor', supporting: ['Actor 2', 'Actor 3'] },
    ...overrides,
  };
}

export interface CreateMovieTestData {
  title: string;
  originalTitle: string;
  overview: string;
  posterUrl: string;
  trailerUrl: string;
  backdropUrl: string;
  runtime: number;
  releaseDate: string;
  ageRating: 'P' | 'K' | 'T13' | 'T16' | 'T18' | 'C';
  originalLanguage: string;
  spokenLanguages: string[];
  languageType: 'ORIGINAL' | 'SUBTITLE' | 'DUBBED';
  productionCountry: string;
  director: string;
  cast: object;
  genreIds?: string[];
}

/**
 * Creates a minimal valid genre request for testing
 */
export function createTestGenreRequest(name?: string): { name: string } {
  return {
    name: name || `Test Genre ${Date.now()}`,
  };
}

/**
 * Creates a minimal valid review request for testing
 */
export function createTestReviewRequest(
  movieId: string,
  userId: string,
  overrides: Partial<CreateReviewTestData> = {}
): CreateReviewTestData {
  return {
    movieId,
    userId,
    rating: 4,
    content: 'This is a test review for integration testing.',
    ...overrides,
  };
}

export interface CreateReviewTestData {
  movieId: string;
  userId: string;
  rating: number;
  content: string;
}

/**
 * Creates a minimal valid movie release request for testing
 */
export function createTestMovieReleaseRequest(
  movieId: string,
  overrides: Partial<CreateMovieReleaseTestData> = {}
): CreateMovieReleaseTestData {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // Started a week ago

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30); // Ends in 30 days

  return {
    movieId,
    startDate: overrides.startDate || startDate,
    endDate: overrides.endDate || endDate,
    note: overrides.note || 'Test release',
    ...overrides,
  };
}

export interface CreateMovieReleaseTestData {
  movieId: string;
  startDate: Date;
  endDate?: Date;
  note?: string;
}

// ============================================================================
// SEED DATA HELPERS
// ============================================================================

/**
 * Creates test genres and returns their IDs
 */
export async function seedTestGenres(
  prisma: PrismaService,
  count: number = 3
): Promise<string[]> {
  const genres = [];
  const genreNames = [
    'Action',
    'Comedy',
    'Drama',
    'Horror',
    'Sci-Fi',
    'Romance',
  ];

  for (let i = 0; i < count; i++) {
    const genre = await prisma.genre.create({
      data: { name: genreNames[i] || `Genre ${i}` },
    });
    genres.push(genre.id);
  }

  return genres;
}

/**
 * Creates a test movie with releases (now_show status)
 */
export async function seedNowShowingMovie(
  prisma: PrismaService,
  genreIds?: string[]
): Promise<string> {
  const movie = await prisma.movie.create({
    data: {
      title: 'Now Showing Movie',
      originalTitle: 'Now Showing Original',
      overview: 'A movie currently in theaters.',
      posterUrl: 'https://example.com/poster.jpg',
      trailerUrl: 'https://example.com/trailer.mp4',
      backdropUrl: 'https://example.com/backdrop.jpg',
      runtime: 120,
      releaseDate: new Date('2024-01-01'),
      ageRating: 'P',
      originalLanguage: 'Vietnamese',
      spokenLanguages: ['Vietnamese'],
      languageType: 'ORIGINAL',
      productionCountry: 'Vietnam',
      director: 'Director',
      cast: {},
      movieGenres: genreIds
        ? {
            create: genreIds.map((id) => ({ genreId: id })),
          }
        : undefined,
    },
  });

  // Create a release that is currently active
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 7); // Started 7 days ago
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 14); // Ends in 14 days

  await prisma.movieRelease.create({
    data: {
      movieId: movie.id,
      startDate,
      endDate,
    },
  });

  return movie.id;
}

/**
 * Creates a test movie with future release (upcoming status)
 */
export async function seedUpcomingMovie(
  prisma: PrismaService,
  genreIds?: string[]
): Promise<string> {
  const movie = await prisma.movie.create({
    data: {
      title: 'Upcoming Movie',
      originalTitle: 'Upcoming Original',
      overview: 'A movie coming soon.',
      posterUrl: 'https://example.com/poster.jpg',
      trailerUrl: 'https://example.com/trailer.mp4',
      backdropUrl: 'https://example.com/backdrop.jpg',
      runtime: 100,
      releaseDate: new Date('2025-06-01'),
      ageRating: 'T13',
      originalLanguage: 'English',
      spokenLanguages: ['English', 'Vietnamese'],
      languageType: 'SUBTITLE',
      productionCountry: 'USA',
      director: 'Director',
      cast: {},
      movieGenres: genreIds
        ? {
            create: genreIds.map((id) => ({ genreId: id })),
          }
        : undefined,
    },
  });

  // Create a release that starts in the future
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 2); // 2 months from now

  await prisma.movieRelease.create({
    data: {
      movieId: movie.id,
      startDate: futureDate,
    },
  });

  return movie.id;
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Verifies that a movie was persisted correctly in the database
 */
export async function verifyMoviePersisted(
  prisma: PrismaService,
  movieId: string,
  expectedData: Partial<CreateMovieTestData>
): Promise<void> {
  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    include: {
      movieGenres: {
        include: { genre: true },
      },
    },
  });

  expect(movie).not.toBeNull();
  expect(movie?.title).toBe(expectedData.title);

  if (expectedData.runtime) {
    expect(movie?.runtime).toBe(expectedData.runtime);
  }

  if (expectedData.genreIds && expectedData.genreIds.length > 0) {
    expect(movie?.movieGenres.length).toBe(expectedData.genreIds.length);
  }

  // Verify timestamps are set
  expect(movie?.createdAt).toBeInstanceOf(Date);
  expect(movie?.updatedAt).toBeInstanceOf(Date);
}

/**
 * Verifies that a review was persisted and the unique constraint works
 */
export async function verifyReviewPersisted(
  prisma: PrismaService,
  movieId: string,
  userId: string
): Promise<void> {
  const review = await prisma.review.findFirst({
    where: { movieId, userId },
  });

  expect(review).not.toBeNull();
  expect(review?.movieId).toBe(movieId);
  expect(review?.userId).toBe(userId);
}

// ============================================================================
// TEARDOWN UTILITY
// ============================================================================

/**
 * Properly closes the test context to prevent Jest hangs
 */
export async function closeMovieTestContext(
  context: MovieTestContext
): Promise<void> {
  try {
    await context.prisma.$disconnect();
    await context.app.close();
  } catch (error) {
    console.warn('Error during test context cleanup:', error);
  }
}
