/**
 * Review Module Integration Tests
 *
 * Tests the Review CRUD operations:
 * - getReviews (via MovieController and ReviewController)
 * - createReview
 * - updateReview
 * - deleteReview
 *
 * Key Test Focus:
 * - Unique constraint [movieId, userId] - one review per user per movie
 * - Duplicate review creation should fail with P2002 error
 *
 * @see test/docs/MOVIE_SERVICE_INTEGRATION_TEST_DOCS.md Section 3
 */

import {
  MovieTestContext,
  createMovieTestingModule,
  cleanupMovieTestData,
  closeMovieTestContext,
  createTestReviewRequest,
  verifyReviewPersisted,
} from './helpers/movie-test-helpers';

describe('Review Module Integration Tests', () => {
  let ctx: MovieTestContext;
  let testMovieId: string;

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

    // Create a test movie for reviews
    const movie = await ctx.prisma.movie.create({
      data: {
        title: 'Movie For Review Tests',
        originalTitle: 'Original',
        overview: 'Overview',
        posterUrl: 'https://example.com/poster.jpg',
        trailerUrl: 'https://example.com/trailer.mp4',
        backdropUrl: 'https://example.com/backdrop.jpg',
        runtime: 120,
        releaseDate: new Date(),
        ageRating: 'P',
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

  // ============================================================================
  // 3.1 getReviews (via MovieController)
  // ============================================================================

  describe('3.1 getReviews (via MovieController)', () => {
    beforeEach(async () => {
      // Create test reviews
      await ctx.prisma.review.createMany({
        data: [
          {
            movieId: testMovieId,
            userId: 'user1',
            rating: 5,
            content: 'Excellent!',
          },
          {
            movieId: testMovieId,
            userId: 'user2',
            rating: 4,
            content: 'Very good',
          },
          {
            movieId: testMovieId,
            userId: 'user3',
            rating: 3,
            content: 'Average',
          },
          {
            movieId: testMovieId,
            userId: 'user4',
            rating: 2,
            content: 'Below average',
          },
          { movieId: testMovieId, userId: 'user5', rating: 1, content: 'Bad' },
        ],
      });
    });

    describe('Success Scenarios', () => {
      it('should return paginated reviews for a movie', async () => {
        // Act
        const result = await ctx.movieController.getReviews({
          movieId: testMovieId,
          page: 1,
          limit: 10,
        } as any);

        // Assert
        expect(result.message).toBe('Get reviews successfully');
        expect(result.data.length).toBe(5);
        expect(result.meta).toMatchObject({
          page: 1,
          limit: 10,
          totalRecords: 5,
        });
      });

      it('should filter reviews by userId', async () => {
        // Act
        const result = await ctx.movieController.getReviews({
          userId: 'user1',
          page: 1,
          limit: 10,
        });

        // Assert
        expect(result.data.length).toBe(1);
        expect(result.data[0].userId).toBe('user1');
        expect(result.data[0].rating).toBe(5);
      });

      it('should filter reviews by rating', async () => {
        // Act
        const result = await ctx.movieController.getReviews({
          movieId: testMovieId,
          rating: '4',
          page: 1,
          limit: 10,
        } as any);

        // Assert
        expect(result.data.length).toBe(1);
        expect(result.data[0].rating).toBe(4);
      });

      it('should handle pagination correctly', async () => {
        // Act
        const page1 = await ctx.movieController.getReviews({
          movieId: testMovieId,
          page: 1,
          limit: 2,
        } as any);

        const page2 = await ctx.movieController.getReviews({
          movieId: testMovieId,
          page: 2,
          limit: 2,
        } as any);

        // Assert
        expect(page1.data.length).toBe(2);
        expect(page1.meta?.hasNext).toBe(true);
        expect(page2.data.length).toBe(2);
        expect(page2.meta?.hasPrev).toBe(true);
      });

      it('should sort reviews by createdAt descending by default', async () => {
        // Act
        const result = await ctx.movieController.getReviews({
          movieId: testMovieId,
          page: 1,
          limit: 10,
        } as any);

        // Assert - Reviews should be in reverse chronological order
        const dates = result.data.map((r) => new Date(r.createdAt).getTime());
        const sortedDates = [...dates].sort((a, b) => b - a);
        expect(dates).toEqual(sortedDates);
      });

      it('should return empty array when no reviews match filter', async () => {
        // Act
        const result = await ctx.movieController.getReviews({
          movieId: '00000000-0000-0000-0000-000000000000',
          page: 1,
          limit: 10,
        } as any);

        // Assert
        expect(result.data).toEqual([]);
        expect(result.meta?.totalRecords).toBe(0);
      });
    });
  });

  // ============================================================================
  // 3.1 getReviews (via ReviewController) - Comparison Test
  // ============================================================================

  describe('3.1 getReviews (via ReviewController)', () => {
    beforeEach(async () => {
      await ctx.prisma.review.createMany({
        data: [
          {
            movieId: testMovieId,
            userId: 'user1',
            rating: 5,
            content: 'Excellent!',
          },
          {
            movieId: testMovieId,
            userId: 'user2',
            rating: 4,
            content: 'Very good',
          },
        ],
      });
    });

    it('should return reviews with movie info included', async () => {
      // Act
      const result = await ctx.reviewController.findAll({
        movieId: testMovieId,
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.message).toBe('Get reviews successfully');
      expect(result.data.length).toBe(2);

      // ReviewController includes movie info
      result.data.forEach((review) => {
        expect(review.movie).toBeDefined();
        expect(review.movie?.title).toBe('Movie For Review Tests');
      });
    });

    it('should behave consistently with MovieController.getReviews', async () => {
      // Act - Call both endpoints
      const movieControllerResult = await ctx.movieController.getReviews({
        movieId: testMovieId,
        page: 1,
        limit: 10,
      } as any);

      const reviewControllerResult = await ctx.reviewController.findAll({
        movieId: testMovieId,
        page: 1,
        limit: 10,
      });

      // Assert - Same record count
      expect(movieControllerResult.data.length).toBe(
        reviewControllerResult.data.length
      );
      expect(movieControllerResult.meta?.totalRecords).toBe(
        reviewControllerResult.meta?.totalRecords
      );
    });
  });

  // ============================================================================
  // 3.2 createReview
  // ============================================================================

  describe('3.2 createReview', () => {
    describe('Success Scenarios', () => {
      it('should create review for a movie', async () => {
        // Arrange
        const request = createTestReviewRequest(testMovieId, 'test-user-1', {
          rating: 5,
          content: 'This is a great movie!',
        });

        // Act
        const result = await ctx.movieController.createReview(request);

        // Assert
        expect(result.message).toContain('Create review');
        expect(result.data.id).toBeDefined();
        expect(result.data.rating).toBe(5);
        expect(result.data.content).toBe('This is a great movie!');

        // Verify in database
        await verifyReviewPersisted(ctx.prisma, testMovieId, 'test-user-1');
      });

      it('should create review with minimum rating (1)', async () => {
        // Arrange
        const request = createTestReviewRequest(testMovieId, 'user-min', {
          rating: 1,
          content: 'Terrible movie',
        });

        // Act
        const result = await ctx.movieController.createReview(request);

        // Assert
        expect(result.data.rating).toBe(1);
      });

      it('should create review with maximum rating (5)', async () => {
        // Arrange
        const request = createTestReviewRequest(testMovieId, 'user-max', {
          rating: 5,
          content: 'Perfect movie!',
        });

        // Act
        const result = await ctx.movieController.createReview(request);

        // Assert
        expect(result.data.rating).toBe(5);
      });

      it('should set createdAt timestamp', async () => {
        // Arrange
        const request = createTestReviewRequest(testMovieId, 'user-timestamp');
        const beforeCreate = new Date();

        // Act
        const result = await ctx.movieController.createReview(request);

        // Assert
        const dbReview = await ctx.prisma.review.findUnique({
          where: { id: result.data.id },
        });
        expect(dbReview?.createdAt.getTime()).toBeGreaterThanOrEqual(
          beforeCreate.getTime() - 1000
        );
      });
    });

    describe('Unique Constraint Tests', () => {
      it('should fail when user tries to review same movie twice (P2002)', async () => {
        // Arrange - Create first review
        const request = createTestReviewRequest(testMovieId, 'duplicate-user', {
          rating: 4,
          content: 'First review',
        });

        await ctx.movieController.createReview(request);

        // Act & Assert - Try to create second review
        const duplicateRequest = createTestReviewRequest(
          testMovieId,
          'duplicate-user',
          {
            rating: 5,
            content: 'Second review attempt',
          }
        );

        await expect(
          ctx.movieController.createReview(duplicateRequest)
        ).rejects.toMatchObject({
          code: 'P2002', // Prisma unique constraint violation
        });
      });

      it('should allow same user to review different movies', async () => {
        // Arrange - Create second movie
        const secondMovie = await ctx.prisma.movie.create({
          data: {
            title: 'Second Movie',
            originalTitle: 'Second Original',
            overview: 'Overview',
            posterUrl: 'https://example.com/poster.jpg',
            trailerUrl: 'https://example.com/trailer.mp4',
            backdropUrl: 'https://example.com/backdrop.jpg',
            runtime: 100,
            releaseDate: new Date(),
            ageRating: 'P',
            originalLanguage: 'Vietnamese',
            spokenLanguages: ['Vietnamese'],
            languageType: 'ORIGINAL',
            productionCountry: 'Vietnam',
            director: 'Director',
            cast: {},
          },
        });

        // Act - User reviews both movies
        const review1 = await ctx.movieController.createReview(
          createTestReviewRequest(testMovieId, 'multi-movie-user', {
            rating: 4,
          })
        );

        const review2 = await ctx.movieController.createReview(
          createTestReviewRequest(secondMovie.id, 'multi-movie-user', {
            rating: 5,
          })
        );

        // Assert - Both should succeed
        expect(review1.data.id).toBeDefined();
        expect(review2.data.id).toBeDefined();
        expect(review1.data.id).not.toBe(review2.data.id);
      });

      it('should allow different users to review same movie', async () => {
        // Act
        const review1 = await ctx.movieController.createReview(
          createTestReviewRequest(testMovieId, 'user-a', { rating: 4 })
        );

        const review2 = await ctx.movieController.createReview(
          createTestReviewRequest(testMovieId, 'user-b', { rating: 5 })
        );

        // Assert - Both should succeed
        expect(review1.data.id).toBeDefined();
        expect(review2.data.id).toBeDefined();

        // Verify both reviews exist
        const reviews = await ctx.prisma.review.findMany({
          where: { movieId: testMovieId },
        });
        expect(reviews.length).toBe(2);
      });
    });
  });

  // ============================================================================
  // 3.3 updateReview
  // ============================================================================

  describe('3.3 updateReview', () => {
    let testReviewId: string;

    beforeEach(async () => {
      const review = await ctx.prisma.review.create({
        data: {
          movieId: testMovieId,
          userId: 'update-test-user',
          rating: 3,
          content: 'Original content',
        },
      });
      testReviewId = review.id;
    });

    describe('Success Scenarios', () => {
      it('should update review rating', async () => {
        // Arrange
        const updateRequest = { rating: 5 };

        // Act
        const result = await ctx.movieController.updateReview({
          id: testReviewId,
          request: updateRequest,
        });

        // Assert
        expect(result.message).toContain('Update review');
        expect(result.data.rating).toBe(5);

        // Verify in database
        const dbReview = await ctx.prisma.review.findUnique({
          where: { id: testReviewId },
        });
        expect(dbReview?.rating).toBe(5);
      });

      it('should update review content', async () => {
        // Arrange
        const updateRequest = { content: 'Updated content here' };

        // Act
        const result = await ctx.movieController.updateReview({
          id: testReviewId,
          request: updateRequest,
        });

        // Assert
        expect(result.data.content).toBe('Updated content here');
      });

      it('should update both rating and content at once', async () => {
        // Arrange
        const updateRequest = {
          rating: 1,
          content: 'Changed my mind, this movie is bad',
        };

        // Act
        const result = await ctx.movieController.updateReview({
          id: testReviewId,
          request: updateRequest,
        });

        // Assert
        expect(result.data.rating).toBe(1);
        expect(result.data.content).toBe('Changed my mind, this movie is bad');
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw error for non-existent review', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.movieController.updateReview({
            id: nonExistentId,
            request: { rating: 5 },
          })
        ).rejects.toThrow();
      });
    });
  });

  // ============================================================================
  // 3.4 deleteReview (via ReviewController)
  // ============================================================================

  describe('3.4 deleteReview', () => {
    let testReviewId: string;

    beforeEach(async () => {
      const review = await ctx.prisma.review.create({
        data: {
          movieId: testMovieId,
          userId: 'delete-test-user',
          rating: 4,
          content: 'Review to be deleted',
        },
      });
      testReviewId = review.id;
    });

    describe('Success Scenarios', () => {
      it('should delete review', async () => {
        // Verify review exists
        const beforeDelete = await ctx.prisma.review.findUnique({
          where: { id: testReviewId },
        });
        expect(beforeDelete).not.toBeNull();

        // Act
        const result = await ctx.reviewController.remove(testReviewId);

        // Assert
        expect(result.message).toBe('Delete review successfully!');

        // Verify deleted
        const afterDelete = await ctx.prisma.review.findUnique({
          where: { id: testReviewId },
        });
        expect(afterDelete).toBeNull();
      });

      it('should allow user to create new review after deleting old one', async () => {
        // Arrange - Delete existing review
        await ctx.reviewController.remove(testReviewId);

        // Act - Create new review for same user/movie
        const newReview = await ctx.movieController.createReview(
          createTestReviewRequest(testMovieId, 'delete-test-user', {
            rating: 5,
          })
        );

        // Assert
        expect(newReview.data.id).toBeDefined();
        expect(newReview.data.rating).toBe(5);
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw error for non-existent review', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.reviewController.remove(nonExistentId)
        ).rejects.toThrow();
      });
    });
  });

  // ============================================================================
  // Integration with Movie Rating Stats
  // ============================================================================

  describe('Review Impact on Movie Stats', () => {
    it('should update averageRating when reviews are added', async () => {
      // Arrange - Create reviews
      await ctx.prisma.review.createMany({
        data: [
          { movieId: testMovieId, userId: 'user1', rating: 4, content: 'Good' },
          {
            movieId: testMovieId,
            userId: 'user2',
            rating: 5,
            content: 'Great',
          },
          { movieId: testMovieId, userId: 'user3', rating: 3, content: 'OK' },
        ],
      });

      // Act - Get movie detail
      const result = await ctx.movieController.getDetail(testMovieId);

      // Assert - Average should be (4+5+3)/3 = 4
      expect(result.data.averageRating).toBe(4);
      expect(result.data.reviewCount).toBe(3);
    });

    it('should recalculate stats after review is deleted', async () => {
      // Arrange - Create reviews
      const review1 = await ctx.prisma.review.create({
        data: {
          movieId: testMovieId,
          userId: 'user1',
          rating: 2,
          content: 'Bad',
        },
      });
      await ctx.prisma.review.create({
        data: {
          movieId: testMovieId,
          userId: 'user2',
          rating: 5,
          content: 'Great',
        },
      });

      // Check initial average: (2+5)/2 = 3.5
      const beforeDelete = await ctx.movieController.getDetail(testMovieId);
      expect(beforeDelete.data.reviewCount).toBe(2);

      // Act - Delete the bad review
      await ctx.reviewController.remove(review1.id);

      // Assert - Now only 5-star review remains
      const afterDelete = await ctx.movieController.getDetail(testMovieId);
      expect(afterDelete.data.averageRating).toBe(5);
      expect(afterDelete.data.reviewCount).toBe(1);
    });
  });
});
