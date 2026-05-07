/**
 * Genre Module Integration Tests
 *
 * Tests the Genre CRUD operations:
 * - getGenres
 * - findGenreById
 * - createGenre
 * - updateGenre
 * - deleteGenre
 *
 * @see test/docs/MOVIE_SERVICE_INTEGRATION_TEST_DOCS.md Section 4
 */

import {
  MovieTestContext,
  createMovieTestingModule,
  cleanupMovieTestData,
  closeMovieTestContext,
  createTestGenreRequest,
} from './helpers/movie-test-helpers';

describe('Genre Module Integration Tests', () => {
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
  // 4.1 getGenres
  // ============================================================================

  describe('4.1 getGenres', () => {
    beforeEach(async () => {
      // Create test genres
      await ctx.prisma.genre.createMany({
        data: [
          { name: 'Action' },
          { name: 'Comedy' },
          { name: 'Drama' },
          { name: 'Horror' },
          { name: 'Sci-Fi' },
        ],
      });
    });

    describe('Success Scenarios', () => {
      it('should return all genres', async () => {
        // Act
        const result = await ctx.genreController.getGenres();

        // Assert
        expect(result.data.length).toBe(5);
        expect(result.data.map((g) => g.name)).toEqual(
          expect.arrayContaining([
            'Action',
            'Comedy',
            'Drama',
            'Horror',
            'Sci-Fi',
          ])
        );
      });

      it('should return empty array when no genres exist', async () => {
        // Arrange - Clear all genres
        await ctx.prisma.genre.deleteMany();

        // Act
        const result = await ctx.genreController.getGenres();

        // Assert
        expect(result.data).toEqual([]);
      });

      it('should include id and name for each genre', async () => {
        // Act
        const result = await ctx.genreController.getGenres();

        // Assert
        result.data.forEach((genre) => {
          expect(genre.id).toBeDefined();
          expect(typeof genre.id).toBe('string');
          expect(genre.name).toBeDefined();
          expect(typeof genre.name).toBe('string');
        });
      });
    });
  });

  // ============================================================================
  // 4.2 findGenreById
  // ============================================================================

  describe('4.2 findGenreById', () => {
    let testGenreId: string;

    beforeEach(async () => {
      const genre = await ctx.prisma.genre.create({
        data: { name: 'Test Genre' },
      });
      testGenreId = genre.id;
    });

    describe('Success Scenarios', () => {
      it('should return genre by id', async () => {
        // Act
        const result = await ctx.genreController.findGenreById(testGenreId);

        // Assert
        expect(result.data).toBeDefined();
        expect(result.data.id).toBe(testGenreId);
        expect(result.data.name).toBe('Test Genre');
      });
    });

    describe('Failure Scenarios', () => {
      it('should return null for non-existent genre', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act
        const result = await ctx.genreController.findGenreById(nonExistentId);

        // Assert - Prisma findUnique returns null for not found
        expect(result.data).toBeNull();
      });
    });
  });

  // ============================================================================
  // 4.3 createGenre
  // ============================================================================

  describe('4.3 createGenre', () => {
    describe('Success Scenarios', () => {
      it('should create genre with unique name', async () => {
        // Arrange
        const request = createTestGenreRequest('New Genre');

        // Act
        const result = await ctx.genreController.createGenre(request);

        // Assert
        expect(result.message).toBe('Create genre successfully!');
        expect(result.data.id).toBeDefined();
        expect(result.data.name).toBe('New Genre');

        // Verify in database
        const dbGenre = await ctx.prisma.genre.findUnique({
          where: { id: result.data.id },
        });
        expect(dbGenre).not.toBeNull();
        expect(dbGenre?.name).toBe('New Genre');
      });

      it('should generate UUID for genre id', async () => {
        // Arrange
        const request = createTestGenreRequest();

        // Act
        const result = await ctx.genreController.createGenre(request);

        // Assert - UUID format validation
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(result.data.id).toMatch(uuidRegex);
      });
    });

    describe('Unique Name Constraint', () => {
      it('should fail when creating genre with duplicate name', async () => {
        // Arrange - Create first genre
        await ctx.genreController.createGenre({ name: 'Unique Genre' });

        // Act & Assert - Try to create duplicate
        await expect(
          ctx.genreController.createGenre({ name: 'Unique Genre' })
        ).rejects.toMatchObject({
          code: 'P2002', // Prisma unique constraint violation
        });
      });

      it('should allow creating genres with different names', async () => {
        // Act
        const result1 = await ctx.genreController.createGenre({
          name: 'Genre A',
        });
        const result2 = await ctx.genreController.createGenre({
          name: 'Genre B',
        });

        // Assert
        expect(result1.data.id).toBeDefined();
        expect(result2.data.id).toBeDefined();
        expect(result1.data.id).not.toBe(result2.data.id);
      });
    });
  });

  // ============================================================================
  // 4.4 updateGenre
  // ============================================================================

  describe('4.4 updateGenre', () => {
    let testGenreId: string;

    beforeEach(async () => {
      const genre = await ctx.prisma.genre.create({
        data: { name: 'Original Genre Name' },
      });
      testGenreId = genre.id;
    });

    describe('Success Scenarios', () => {
      it('should update genre name', async () => {
        // Arrange
        const updateRequest = { name: 'Updated Genre Name' };

        // Act
        const result = await ctx.genreController.updateGenre({
          id: testGenreId,
          request: updateRequest,
        });

        // Assert
        expect(result.message).toBe('Update genre successfully!');
        expect(result.data.name).toBe('Updated Genre Name');

        // Verify in database
        const dbGenre = await ctx.prisma.genre.findUnique({
          where: { id: testGenreId },
        });
        expect(dbGenre?.name).toBe('Updated Genre Name');
      });

      it('should preserve genre id after update', async () => {
        // Arrange
        const updateRequest = { name: 'New Name' };

        // Act
        const result = await ctx.genreController.updateGenre({
          id: testGenreId,
          request: updateRequest,
        });

        // Assert
        expect(result.data.id).toBe(testGenreId);
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw error for non-existent genre', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.genreController.updateGenre({
            id: nonExistentId,
            request: { name: 'New Name' },
          })
        ).rejects.toThrow();
      });

      it('should fail when updating to an existing genre name', async () => {
        // Arrange - Create another genre
        await ctx.prisma.genre.create({ data: { name: 'Existing Genre' } });

        // Act & Assert - Try to update to existing name
        await expect(
          ctx.genreController.updateGenre({
            id: testGenreId,
            request: { name: 'Existing Genre' },
          })
        ).rejects.toMatchObject({
          code: 'P2002',
        });
      });
    });
  });

  // ============================================================================
  // 4.5 deleteGenre
  // ============================================================================

  describe('4.5 deleteGenre', () => {
    let testGenreId: string;

    beforeEach(async () => {
      const genre = await ctx.prisma.genre.create({
        data: { name: 'Genre To Delete' },
      });
      testGenreId = genre.id;
    });

    describe('Success Scenarios', () => {
      it('should delete genre', async () => {
        // Verify genre exists
        const beforeDelete = await ctx.prisma.genre.findUnique({
          where: { id: testGenreId },
        });
        expect(beforeDelete).not.toBeNull();

        // Act
        const result = await ctx.genreController.deleteGenre(testGenreId);

        // Assert
        expect(result.message).toBe('Delete genre successfully!');

        // Verify deleted
        const afterDelete = await ctx.prisma.genre.findUnique({
          where: { id: testGenreId },
        });
        expect(afterDelete).toBeNull();
      });
    });

    describe('Failure Scenarios', () => {
      it('should throw error for non-existent genre', async () => {
        // Arrange
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // Act & Assert
        await expect(
          ctx.genreController.deleteGenre(nonExistentId)
        ).rejects.toThrow();
      });

      it('should handle genre deletion with linked movies', async () => {
        // Arrange - Create a movie linked to this genre
        const movie = await ctx.prisma.movie.create({
          data: {
            title: 'Movie With Genre',
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
            movieGenres: {
              create: { genreId: testGenreId },
            },
          },
        });

        // Act & Assert - Depending on FK constraints, this may fail or cascade
        // If FK is set to CASCADE, genre deletion will also delete movieGenre links
        // If FK is RESTRICT, it will throw an error
        try {
          await ctx.genreController.deleteGenre(testGenreId);

          // If cascade, verify links are removed
          const movieGenres = await ctx.prisma.movieGenre.findMany({
            where: { genreId: testGenreId },
          });
          expect(movieGenres.length).toBe(0);
        } catch (error: any) {
          // If FK constraint prevents deletion
          expect(error.code).toBe('P2003'); // Foreign key constraint error
        }

        // Cleanup
        await ctx.prisma.movieGenre.deleteMany({
          where: { movieId: movie.id },
        });
        await ctx.prisma.movie.delete({ where: { id: movie.id } });
      });
    });
  });

  // ============================================================================
  // Genre Integration with Movies
  // ============================================================================

  describe('Genre Integration with Movies', () => {
    it('should correctly link genres when creating movies', async () => {
      // Arrange - Create genres
      const actionGenre = await ctx.prisma.genre.create({
        data: { name: 'Action' },
      });
      const comedyGenre = await ctx.prisma.genre.create({
        data: { name: 'Comedy' },
      });

      // Act - Create movie with genres
      const movie = await ctx.prisma.movie.create({
        data: {
          title: 'Action Comedy Movie',
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
          movieGenres: {
            create: [{ genreId: actionGenre.id }, { genreId: comedyGenre.id }],
          },
        },
        include: {
          movieGenres: {
            include: { genre: true },
          },
        },
      });

      // Assert
      expect(movie.movieGenres.length).toBe(2);
      const genreNames = movie.movieGenres.map((mg) => mg.genre.name);
      expect(genreNames).toContain('Action');
      expect(genreNames).toContain('Comedy');
    });

    it('should show genres in movie detail response', async () => {
      // Arrange
      const genreIds: string[] = [];
      for (const name of ['Action', 'Adventure']) {
        const genre = await ctx.prisma.genre.create({ data: { name } });
        genreIds.push(genre.id);
      }

      const movie = await ctx.prisma.movie.create({
        data: {
          title: 'Genre Test Movie',
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
          movieGenres: {
            create: genreIds.map((id) => ({ genreId: id })),
          },
        },
      });

      // Act
      const result = await ctx.movieController.getDetail(movie.id);

      // Assert
      expect(result.data.genre.length).toBe(2);
      result.data.genre.forEach((g) => {
        expect(g.id).toBeDefined();
        expect(g.name).toBeDefined();
      });
    });
  });
});
