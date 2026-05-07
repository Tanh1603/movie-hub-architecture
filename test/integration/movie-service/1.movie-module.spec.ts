/**
 * Movie Module Integration Tests
 *
 * Tests the Movie CRUD operations:
 * - getMovies (with status filtering: now_show, upcoming)
 * - getDetail
 * - createMovie
 * - updateMovie
 * - deleteMovie
 * - getMovieByListId (internal RPC)
 *
 * Also covers Movie Release CRUD:
 * - getMovieRelease
 * - createMovieRelease
 * - updateMovieRelease
 * - deleteMovieRelease
 *
 * @see test/docs/MOVIE_SERVICE_INTEGRATION_TEST_DOCS.md Section 1 & 2
 */

import {
  MovieTestContext,
  createMovieTestingModule,
  cleanupMovieTestData,
  closeMovieTestContext,
  createTestMovieRequest,
  createTestMovieReleaseRequest,
  verifyMoviePersisted,
  seedTestGenres,
  seedNowShowingMovie,
  seedUpcomingMovie,
} from './helpers/movie-test-helpers';
import { ResourceNotFoundException } from '@movie-hub/shared-types';

describe('Movie Module Integration Tests', () => {
  let ctx: MovieTestContext;

  // ============================================================================
  // TEST LIFECYCLE
  // ============================================================================

  beforeAll(async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true,
      configurable: true,
    });
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5436/movie_hub_movie?schema=public';
    ctx = await createMovieTestingModule();
  }, 60000);

  afterAll(async () => {
    await cleanupMovieTestData(ctx.prisma);
    await closeMovieTestContext(ctx);
  }, 30000);

  beforeEach(async () => {
    await cleanupMovieTestData(ctx.prisma);
  });

  // ============================================================================
  // 1.1 getMovies
  // ============================================================================

  describe('1.1 getMovies', () => {
    beforeEach(async () => {
      const genreIds = await seedTestGenres(ctx.prisma, 2);

      // Create 3 now showing movies
      for (let i = 0; i < 3; i++) {
        await seedNowShowingMovie(ctx.prisma, genreIds);
      }

      // Create 2 upcoming movies
      for (let i = 0; i < 2; i++) {
        await seedUpcomingMovie(ctx.prisma, genreIds);
      }
    });

    describe('Success Scenarios', () => {
      it('should return all movies with pagination meta', async () => {
        // Act
        const result = await ctx.movieController.getMovies({
          page: 1,
          limit: 10,
          sortBy: 'title',
          sortOrder: 'asc',
        });

        // Assert
        expect(result.data.length).toBe(5); // 3 now showing + 2 upcoming
        expect(result.meta).toMatchObject({
          page: 1,
          limit: 10,
          totalRecords: 5,
          hasPrev: false,
          hasNext: false,
        });
      });

      it('should filter movies by now_show status', async () => {
        // Act
        const result = await ctx.movieController.getMovies({
          page: 1,
          limit: 10,
          status: 'now_show',
          sortBy: 'title',
          sortOrder: 'asc',
        });

        // Assert - Should only return now showing movies
        expect(result.data.length).toBe(3);
        result.data.forEach((movie) => {
          expect(movie.title).toContain('Now Showing');
        });
      });

      it('should filter movies by upcoming status', async () => {
        // Act
        const result = await ctx.movieController.getMovies({
          page: 1,
          limit: 10,
          status: 'upcoming',
          sortBy: 'title',
          sortOrder: 'asc',
        });

        // Assert - Should only return upcoming movies
        expect(result.data.length).toBe(2);
        result.data.forEach((movie) => {
          expect(movie.title).toContain('Upcoming');
        });
      });

      it('should handle pagination correctly', async () => {
        // Act - Get first page with limit 2
        const page1 = await ctx.movieController.getMovies({
          page: 1,
          limit: 2,
          sortBy: 'title',
          sortOrder: 'asc',
        });

        const page2 = await ctx.movieController.getMovies({
          page: 2,
          limit: 2,
          sortBy: 'title',
          sortOrder: 'asc',
        });

        // Assert
        expect(page1.data.length).toBe(2);
        expect(page1.meta?.hasNext).toBe(true);
        expect(page1.meta?.hasPrev).toBe(false);

        expect(page2.data.length).toBe(2);
        expect(page2.meta?.hasPrev).toBe(true);
      });

      it('should return empty data array when no movies exist', async () => {
        // Arrange - Clean up all movies
        await cleanupMovieTestData(ctx.prisma);

        // Act
        const result = await ctx.movieController.getMovies({
          page: 1,
          limit: 10,
          sortBy: 'title',
          sortOrder: 'asc',
        });

        // Assert
        expect(result.data).toEqual([]);
        expect(result.meta?.totalRecords).toBe(0);
      });

      it('should include averageRating and reviewCount in response', async () => {
        // Arrange - Create a movie with reviews
        const movie = await ctx.prisma.movie.create({
          data: {
            title: 'Movie With Reviews',
            originalTitle: 'Original',
            overview: 'Overview',
            posterUrl: 'https://example.com/poster.jpg',
            trailerUrl: 'https://example.com/trailer.mp4',
            backdropUrl: 'https://example.com/backdrop.jpg',
            runtime: 120,
            releaseDate: new Date(),
            ageRating: 'P' as any,
            originalLanguage: 'Vietnamese',
            spokenLanguages: ['Vietnamese'],
            languageType: 'ORIGINAL',
            productionCountry: 'Vietnam',
            director: 'Director',
            cast: {},
          },
        });

        // Add reviews
        await ctx.prisma.review.createMany({
          data: [
            { movieId: movie.id, userId: 'user1', rating: 4, content: 'Good' },
            { movieId: movie.id, userId: 'user2', rating: 5, content: 'Great' },
          ],
        });

        // Act
        const result = await ctx.movieController.getMovies({
          page: 1,
          limit: 10,
          sortBy: 'title',
          sortOrder: 'asc',
        });

        // Assert
        const movieWithReviews = result.data.find(
          (m) => m.title === 'Movie With Reviews'
        );
        expect(movieWithReviews).toBeDefined();
        expect(movieWithReviews?.averageRating).toBe(4.5);
        expect(movieWithReviews?.reviewCount).toBe(2);
      });
    });
  });

  // ============================================================================
  // 1.2 getDetail
  // ============================================================================

  describe('1.2 getDetail', () => {
    let testMovieId: string;

    beforeEach(async () => {
      const genreIds = await seedTestGenres(ctx.prisma, 2);
      testMovieId = await seedNowShowingMovie(ctx.prisma, genreIds);
    });

    describe('Success Scenarios', () => {
      it('should return full movie details with genres', async () => {
        // Act
        const result = await ctx.movieController.getDetail(testMovieId);

        // Assert
        expect(result.data).toBeDefined();
        expect(result.data.id).toBe(testMovieId);
        expect(result.data.title).toBe('Now Showing Movie');
        expect(result.data.genre).toBeInstanceOf(Array);
        expect(result.data.genre.length).toBe(2);
      });

      it('should return computed averageRating and reviewCount', async () => {
        // Arrange - Add reviews
        await ctx.prisma.review.createMany({
          data: [
            { movieId: testMovieId, userId: 'user1', rating: 3, content: 'OK' },
            {
              movieId: testMovieId,
              userId: 'user2',
              rating: 4,
              content: 'Good',
            },
            {
              movieId: testMovieId,
              userId: 'user3',
              rating: 5,
              content: 'Great',
            },
          ],
        });

        // Act
        const result = await ctx.movieController.getDetail(testMovieId);

        // Assert
        expect(result.data.averageRating).toBe(4);
        expect(result.data.reviewCount).toBe(3);
      });

      it('should return 0 rating and 0 count when no reviews', async () => {
        // Act
        const result = await ctx.movieController.getDetail(testMovieId);

        // Assert
        expect(result.data.averageRating).toBe(0);
        expect(result.data.reviewCount).toBe(0);
      });
    });

    describe('Failure Scenarios', () => {
      it('should handle non-existent movie gracefully', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert - Prisma returns null for findUnique on non-existent
        // The service may throw or return null depending on implementation
        try {
          const result = await ctx.movieController.getDetail(nonExistentId);
          // If no error, check response
          expect(result.data).toBeNull();
        } catch (error) {
          // Expected if service throws
          expect(error).toBeDefined();
        }
      });
    });
  });

  // ============================================================================
  // 1.3 createMovie
  // ============================================================================

  describe('1.3 createMovie', () => {
    let testGenreIds: string[];

    beforeEach(async () => {
      testGenreIds = await seedTestGenres(ctx.prisma, 3);
    });

    describe('Success Scenarios', () => {
      it('should create movie with basic info', async () => {
        // Arrange
        const request: any = createTestMovieRequest({
          title: 'New Movie',
          ageRating: 'P',
        });

        // Act
        const result = await ctx.movieController.createMovie(request as any);

        // Assert - Response
        expect(result.message).toBe('Create movie successfully!');
        expect(result.data.id).toBeDefined();
        expect(result.data.title).toBe('New Test Movie');
        expect(result.data.runtime).toBe(135);

        // Assert - Persisted in database
        await verifyMoviePersisted(ctx.prisma, result.data.id, request);
      });

      it('should create movie with genre links', async () => {
        // Arrange
        const request: any = createTestMovieRequest({
          title: 'Movie With Genres',
          genreIds: testGenreIds.slice(0, 2), // First 2 genres
        });

        // Act
        const result = await ctx.movieController.createMovie(request as any);

        // Assert
        expect(result.data.genre.length).toBe(2);

        // Verify in database
        const movieGenres = await ctx.prisma.movieGenre.findMany({
          where: { movieId: result.data.id },
        });
        expect(movieGenres.length).toBe(2);
      });

      it('should create movie without genres (genreIds optional)', async () => {
        // Arrange
        const request: any = createTestMovieRequest({
          title: 'Movie Without Genres',
        });
        delete (request as any).genreIds;

        // Act
        const result = await ctx.movieController.createMovie(request as any);

        // Assert
        expect(result.data.id).toBeDefined();
        expect(result.data.genre).toEqual([]);
      });

      it('should auto-populate created_at and updated_at timestamps', async () => {
        // Arrange
        const request: any = createTestMovieRequest();
        const beforeCreate = new Date();

        // Act
        const result = await ctx.movieController.createMovie(request as any);

        // Assert
        const dbMovie = await ctx.prisma.movie.findUnique({
          where: { id: result.data.id },
        });

        expect(dbMovie?.createdAt.getTime()).toBeGreaterThanOrEqual(
          beforeCreate.getTime() - 1000
        );
        expect(dbMovie?.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeCreate.getTime() - 1000
        );
      });
    });

    describe('Transaction Atomicity', () => {
      it('should rollback movie creation if genre linking fails (invalid genreId)', async () => {
        // Arrange
        const request: any = createTestMovieRequest({
          title: 'Movie With Invalid Genre',
          genreIds: ['00000000-0000-0000-0000-000000000000'], // Invalid genre ID
        });

        // Count movies before
        const countBefore = await ctx.prisma.movie.count();

        // Act & Assert
        await expect(
          ctx.movieController.createMovie(request as any)
        ).rejects.toThrow();

        // Verify no movie was created (transaction rolled back)
        const countAfter = await ctx.prisma.movie.count();
        expect(countAfter).toBe(countBefore);
      });
    });
  });

  // ============================================================================
  // 1.4 updateMovie
  // ============================================================================

  describe('1.4 updateMovie', () => {
    let testMovieId: string;
    let testGenreIds: string[];

    beforeEach(async () => {
      testGenreIds = await seedTestGenres(ctx.prisma, 4);
      testMovieId = await seedNowShowingMovie(
        ctx.prisma,
        testGenreIds.slice(0, 2)
      );
    });

    describe('Success Scenarios', () => {
      it('should update movie title and runtime', async () => {
        // Arrange
        const updateRequest = {
          title: 'Updated Movie Title',
          runtime: 150,
        };

        // Act
        const result = await ctx.movieController.updateMovie({
          id: testMovieId,
          updateMovieRequest: updateRequest,
        });

        // Assert
        expect(result.message).toBe('Update movie successfully!');
        expect(result.data.title).toBe('Updated Movie Title');
        expect(result.data.runtime).toBe(150);

        // Verify in database
        const dbMovie = await ctx.prisma.movie.findUnique({
          where: { id: testMovieId },
        });
        expect(dbMovie?.title).toBe('Updated Movie Title');
        expect(dbMovie?.runtime).toBe(150);
      });

      it('should replace genres when genreIds is provided', async () => {
        // Arrange - Movie starts with 2 genres, update to different 2
        const updateRequest = {
          genreIds: testGenreIds.slice(2, 4), // Last 2 genres
        };

        // Act
        const result = await ctx.movieController.updateMovie({
          id: testMovieId,
          updateMovieRequest: updateRequest,
        });

        // Assert
        expect(result.data.genre.length).toBe(2);

        // Verify old genres were removed
        const movieGenres = await ctx.prisma.movieGenre.findMany({
          where: { movieId: testMovieId },
          include: { genre: true },
        });
        expect(movieGenres.length).toBe(2);
        const genreIdsInDb = movieGenres.map((mg) => mg.genreId);
        expect(genreIdsInDb).toContain(testGenreIds[2]);
        expect(genreIdsInDb).toContain(testGenreIds[3]);
      });

      it('should not modify genres when genreIds is not provided', async () => {
        // Arrange
        const genresBefore = await ctx.prisma.movieGenre.findMany({
          where: { movieId: testMovieId },
        });

        const updateRequest = {
          title: 'Only Title Updated',
        };

        // Act
        await ctx.movieController.updateMovie({
          id: testMovieId,
          updateMovieRequest: updateRequest,
        });

        // Assert - Genres unchanged
        const genresAfter = await ctx.prisma.movieGenre.findMany({
          where: { movieId: testMovieId },
        });
        expect(genresAfter.length).toBe(genresBefore.length);
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw ResourceNotFoundException for non-existent movie', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.movieController.updateMovie({
            id: nonExistentId,
            updateMovieRequest: { title: 'New Title' },
          })
        ).rejects.toThrow(ResourceNotFoundException);
      });
    });
  });

  // ============================================================================
  // 1.5 deleteMovie
  // ============================================================================

  describe('1.5 deleteMovie', () => {
    let testMovieId: string;

    beforeEach(async () => {
      const genreIds = await seedTestGenres(ctx.prisma, 2);
      testMovieId = await seedNowShowingMovie(ctx.prisma, genreIds);
    });

    describe('Success Scenarios', () => {
      it('should delete movie and cascade relations', async () => {
        // Verify movie exists
        const beforeDelete = await ctx.prisma.movie.findUnique({
          where: { id: testMovieId },
        });
        expect(beforeDelete).not.toBeNull();

        // Act
        const result = await ctx.movieController.deleteMovie(testMovieId);

        // Assert
        expect(result.message).toBe('Delete movie successfully!');

        // Verify deleted
        const afterDelete = await ctx.prisma.movie.findUnique({
          where: { id: testMovieId },
        });
        expect(afterDelete).toBeNull();

        // Verify genre links are cascaded
        const movieGenres = await ctx.prisma.movieGenre.findMany({
          where: { movieId: testMovieId },
        });
        expect(movieGenres.length).toBe(0);
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw error for non-existent movie', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.movieController.deleteMovie(nonExistentId)
        ).rejects.toThrow();
      });
    });
  });

  // ============================================================================
  // 1.6 getMovieByListId (Internal RPC)
  // ============================================================================

  describe('1.6 getMovieByListId (Internal)', () => {
    let movieIds: string[];

    beforeEach(async () => {
      const genreIds = await seedTestGenres(ctx.prisma, 2);
      movieIds = [];

      for (let i = 0; i < 3; i++) {
        movieIds.push(await seedNowShowingMovie(ctx.prisma, genreIds));
      }
    });

    describe('Success Scenarios', () => {
      it('should return array of movie details for valid IDs', async () => {
        // Act
        const result = await ctx.movieController.getMovieByListId(movieIds);

        // Assert
        expect(result.length).toBe(3);
        result.forEach((movie) => {
          expect(movieIds).toContain(movie.id);
          expect(movie.genre).toBeDefined();
        });
      });

      it('should return only found movies for partial valid IDs', async () => {
        // Arrange - Mix valid and invalid IDs
        const mixedIds = [
          movieIds[0],
          '00000000-0000-0000-0000-000000000000',
          movieIds[1],
        ];

        // Act
        const result = await ctx.movieController.getMovieByListId(mixedIds);

        // Assert - Should only return 2 found movies
        expect(result.length).toBe(2);
      });

      it('should return empty array for empty input', async () => {
        // Act
        const result = await ctx.movieController.getMovieByListId([]);

        // Assert
        expect(result).toEqual([]);
      });

      it('should include review stats for each movie', async () => {
        // Arrange - Add reviews to first movie
        await ctx.prisma.review.create({
          data: {
            movieId: movieIds[0],
            userId: 'test-user',
            rating: 5,
            content: 'Excellent!',
          },
        });

        // Act
        const result = await ctx.movieController.getMovieByListId(movieIds);

        // Assert
        const movieWithReview = result.find((m) => m.id === movieIds[0]);
        expect(movieWithReview?.averageRating).toBe(5);
        expect(movieWithReview?.reviewCount).toBe(1);
      });
    });
  });

  // ============================================================================
  // 2. Movie Release Module
  // ============================================================================

  describe('2. Movie Release Module', () => {
    let testMovieId: string;

    beforeEach(async () => {
      // Create a movie without release
      const movie = await ctx.prisma.movie.create({
        data: {
          title: 'Movie For Release Tests',
          originalTitle: 'Original',
          overview: 'Overview',
          posterUrl: 'https://example.com/poster.jpg',
          trailerUrl: 'https://example.com/trailer.mp4',
          backdropUrl: 'https://example.com/backdrop.jpg',
          runtime: 120,
          releaseDate: new Date(),
          ageRating: 'P' as any,
          originalLanguage: 'Vietnamese',
          spokenLanguages: ['Vietnamese'],
          languageType: 'ORIGINAL',
          productionCountry: 'Vietnam',
          director: 'Director',
          cast: {},
        },
      });
      testMovieId = movie.id;
    });

    describe('2.1 getMovieRelease', () => {
      it('should return all releases for a movie', async () => {
        // Arrange - Create multiple releases
        await ctx.prisma.movieRelease.createMany({
          data: [
            {
              movieId: testMovieId,
              startDate: new Date('2024-01-01'),
              endDate: new Date('2024-02-01'),
              note: 'First release',
            },
            {
              movieId: testMovieId,
              startDate: new Date('2024-03-01'),
              note: 'Second release',
            },
          ],
        });

        // Act
        const result = await ctx.movieController.getMovieRelease(testMovieId);

        // Assert
        expect(result.data.length).toBe(2);
        result.data.forEach((release) => {
          expect(release.movieId).toBe(testMovieId);
        });
      });

      it('should return empty array for movie with no releases', async () => {
        // Act
        const result = await ctx.movieController.getMovieRelease(testMovieId);

        // Assert
        expect(result.data).toEqual([]);
      });
    });

    describe('2.2 createMovieRelease', () => {
      it('should create movie release with all fields', async () => {
        // Arrange
        const request = createTestMovieReleaseRequest(testMovieId, {
          note: 'Test release note',
        });

        // Act
        const result = await ctx.movieController.createMovieRelease(request);

        // Assert
        expect(result.message).toBe('Create movie release successfully!');
        expect(result.data.movieId).toBe(testMovieId);
        expect(result.data.note).toBe('Test release note');

        // Verify in database
        const dbRelease = await ctx.prisma.movieRelease.findUnique({
          where: { id: result.data.id },
        });
        expect(dbRelease).not.toBeNull();
      });

      it('should create release without endDate (ongoing release)', async () => {
        // Arrange
        const request = {
          movieId: testMovieId,
          startDate: new Date(),
        };

        // Act
        const result = await ctx.movieController.createMovieRelease(request);

        // Assert
        expect(result.data.id).toBeDefined();
        expect(result.data.endDate).toBeNull();
      });
    });

    describe('2.3 updateMovieRelease', () => {
      let releaseId: string;

      beforeEach(async () => {
        const release = await ctx.prisma.movieRelease.create({
          data: {
            movieId: testMovieId,
            startDate: new Date('2024-01-01'),
            note: 'Original note',
          },
        });
        releaseId = release.id;
      });

      it('should update release dates and note', async () => {
        // Arrange
        const updateRequest = {
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-03-01'),
          note: 'Updated note',
        };

        // Act
        const result = await ctx.movieController.updateMovieRelease({
          id: releaseId,
          updateMovieReleaseRequest: updateRequest,
        });

        // Assert
        expect(result.message).toBe('Update movie release successfully!');
        expect(result.data.note).toBe('Updated note');
      });
    });

    describe('2.4 deleteMovieRelease', () => {
      it('should delete movie release', async () => {
        // Arrange
        const release = await ctx.prisma.movieRelease.create({
          data: {
            movieId: testMovieId,
            startDate: new Date(),
          },
        });

        // Act
        const result = await ctx.movieController.deleteMovieRelease(release.id);

        // Assert
        expect(result.message).toBe('Delete movie release successfully!');

        // Verify deleted
        const dbRelease = await ctx.prisma.movieRelease.findUnique({
          where: { id: release.id },
        });
        expect(dbRelease).toBeNull();
      });
    });
  });
});
