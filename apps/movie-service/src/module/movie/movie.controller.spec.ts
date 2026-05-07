import { Test, TestingModule } from '@nestjs/testing';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { MovieQuery, MovieServiceMessage } from '@movie-hub/shared-types';

describe('MovieController', () => {
  let controller: MovieController;

  const mockMovieService = {
    getMovies: jest.fn(),
    getMovieDetail: jest.fn(),
    createMovie: jest.fn(),
    updateMovie: jest.fn(),
    deleteMovie: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovieController],
      providers: [
        {
          provide: MovieService,
          useValue: mockMovieService,
        },
      ],
    }).compile();

    controller = module.get<MovieController>(MovieController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMovies', () => {
    it('should call movieService.getMovies with correct parameters', async () => {
      const mockQuery: MovieQuery = { page: 1, limit: 10, status: 'now_show' };
      const expectedResult = {
        data: [
          {
            id: '1',
            title: 'Test Movie',
            posterUrl: 'test-poster.jpg',
            backdropUrl: 'test-backdrop.jpg',
            runtime: 120,
            ageRating: '' as any,
            productionCountry: 'US',
            languageType: '' as any,
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          totalRecords: 1,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        },
      };

      mockMovieService.getMovies.mockResolvedValue(expectedResult);

      const result = await controller.getMovies(mockQuery);

      expect(result).toEqual(expectedResult);
      expect(mockMovieService.getMovies).toHaveBeenCalledWith(mockQuery);
      expect(mockMovieService.getMovies).toHaveBeenCalledTimes(1);
    });

    it('should handle empty query parameters', async () => {
      const mockQuery: MovieQuery = {};
      const expectedResult = {
        data: [],
        meta: null,
      };

      mockMovieService.getMovies.mockResolvedValue(expectedResult);

      const result = await controller.getMovies(mockQuery);

      expect(result).toEqual(expectedResult);
      expect(mockMovieService.getMovies).toHaveBeenCalledWith(mockQuery);
    });

    it('should handle query with sorting parameters', async () => {
      const mockQuery: MovieQuery = { sortBy: 'title', sortOrder: 'asc' };
      const expectedResult = {
        data: [
          {
            id: '1',
            title: 'Action Movie',
            posterUrl: 'action-poster.jpg',
            backdropUrl: 'action-backdrop.jpg',
            runtime: 120,
            ageRating: '' as any,
            productionCountry: 'US',
            languageType: '' as any,
          },
          {
            id: '2',
            title: 'Biography Movie',
            posterUrl: 'bio-poster.jpg',
            backdropUrl: 'bio-backdrop.jpg',
            runtime: 150,
            ageRating: '' as any,
            productionCountry: 'US',
            languageType: '' as any,
          },
        ],
        meta: null,
      };

      mockMovieService.getMovies.mockResolvedValue(expectedResult);

      const result = await controller.getMovies(mockQuery);

      expect(result).toEqual(expectedResult);
      expect(mockMovieService.getMovies).toHaveBeenCalledWith(mockQuery);
    });
  });

  describe('getDetail', () => {
    it('should call movieService.getMovieDetail with correct movie ID', async () => {
      const movieId = '123';
      const expectedResult = {
        data: {
          id: '123',
          title: 'Test Movie Detail',
          originalTitle: 'Original Test Movie',
          overview: 'A detailed test movie',
          posterUrl: 'detail-poster.jpg',
          trailerUrl: 'detail-trailer.mp4',
          backdropUrl: 'detail-backdrop.jpg',
          runtime: 120,
          releaseDate: new Date('2024-01-01'),
          ageRating: '' as any,
          originalLanguage: 'en',
          spokenLanguages: ['en', 'es'],
          languageType: '' as any,
          productionCountry: 'US',
          director: 'Test Director',
          cast: [{ name: 'Actor 1', character: 'Character 1' }],
          genre: [
            { id: 'genre1', name: 'Action' },
            { id: 'genre2', name: 'Drama' },
          ],
        },
      };

      mockMovieService.getMovieDetail.mockResolvedValue(expectedResult);

      const result = await controller.getDetail(movieId);

      expect(result).toEqual(expectedResult);
      expect(mockMovieService.getMovieDetail).toHaveBeenCalledWith(movieId);
      expect(mockMovieService.getMovieDetail).toHaveBeenCalledTimes(1);
    });

    it('should handle movie with no genres', async () => {
      const movieId = '456';
      const expectedResult = {
        data: {
          id: '456',
          title: 'Movie Without Genres',
          originalTitle: 'Original Movie Without Genres',
          overview: 'A movie with no genres',
          posterUrl: 'no-genre-poster.jpg',
          trailerUrl: 'no-genre-trailer.mp4',
          backdropUrl: 'no-genre-backdrop.jpg',
          runtime: 90,
          releaseDate: new Date('2024-02-01'),
          ageRating: '' as any,
          originalLanguage: 'en',
          spokenLanguages: ['en'],
          languageType: '' as any,
          productionCountry: 'US',
          director: 'Another Director',
          cast: [{ name: 'Solo Actor' }],
          genre: [],
        },
      };

      mockMovieService.getMovieDetail.mockResolvedValue(expectedResult);

      const result = await controller.getDetail(movieId);

      expect(result).toEqual(expectedResult);
      expect(mockMovieService.getMovieDetail).toHaveBeenCalledWith(movieId);
    });
  });

  describe('createMovie', () => {
    it('should call movieService.createMovie with correct request data', async () => {
      const createRequest = {
        title: 'New Movie',
        originalTitle: 'New Original Movie',
        overview: 'A new movie',
        posterUrl: 'new-poster.jpg',
        trailerUrl: 'new-trailer.mp4',
        backdropUrl: 'new-backdrop.jpg',
        runtime: 150,
        releaseDate: new Date('2024-01-01'),
        ageRating: '' as any,
        originalLanguage: 'en',
        spokenLanguages: ['en', 'es'],
        languageType: '' as any,
        productionCountry: 'US',
        director: 'New Director',
        cast: [{ name: 'New Actor 1', character: 'New Character 1' }],
        genreIds: ['genre1', 'genre2'],
      };

      const expectedResult = {
        data: {
          id: 'new-movie-id',
          title: 'New Movie',
          originalTitle: 'New Original Movie',
          overview: 'A new movie',
          posterUrl: 'new-poster.jpg',
          trailerUrl: 'new-trailer.mp4',
          backdropUrl: 'new-backdrop.jpg',
          runtime: 150,
          releaseDate: new Date('2024-01-01'),
          ageRating: '' as any,
          originalLanguage: 'en',
          spokenLanguages: ['en', 'es'],
          languageType: '' as any,
          productionCountry: 'US',
          director: 'New Director',
          cast: [{ name: 'New Actor 1', character: 'New Character 1' }],
          genre: [
            { id: 'genre1', name: 'Action' },
            { id: 'genre2', name: 'Drama' },
          ],
        },
        message: 'Create movie successfully!',
      };

      mockMovieService.createMovie.mockResolvedValue(expectedResult);

      const result = await controller.createMovie(createRequest as any);

      expect(result).toEqual(expectedResult);
      expect(mockMovieService.createMovie).toHaveBeenCalledWith(createRequest);
      expect(mockMovieService.createMovie).toHaveBeenCalledTimes(1);
    });

    it('should handle movie creation with minimal data', async () => {
      const createRequest = {
        title: 'Minimal Movie',
        originalTitle: 'Minimal Original Movie',
        overview: 'A minimal movie',
        posterUrl: 'minimal-poster.jpg',
        trailerUrl: 'minimal-trailer.mp4',
        backdropUrl: 'minimal-backdrop.jpg',
        runtime: 90,
        releaseDate: new Date('2024-03-01'),
        ageRating: '' as any,
        originalLanguage: 'en',
        spokenLanguages: ['en'],
        languageType: '' as any,
        productionCountry: 'US',
        director: 'Minimal Director',
        cast: [{ name: 'Minimal Actor' }],
        genreIds: ['genre1'],
      };

      const expectedResult = {
        data: {
          id: 'minimal-movie-id',
          title: 'Minimal Movie',
          originalTitle: 'Minimal Original Movie',
          overview: 'A minimal movie',
          posterUrl: 'minimal-poster.jpg',
          trailerUrl: 'minimal-trailer.mp4',
          backdropUrl: 'minimal-backdrop.jpg',
          runtime: 90,
          releaseDate: new Date('2024-03-01'),
          ageRating: '' as any,
          originalLanguage: 'en',
          spokenLanguages: ['en'],
          languageType: '' as any,
          productionCountry: 'US',
          director: 'Minimal Director',
          cast: [{ name: 'Minimal Actor' }],
          genre: [{ id: 'genre1', name: 'Comedy' }],
        },
        message: 'Create movie successfully!',
      };

      mockMovieService.createMovie.mockResolvedValue(expectedResult);

      const result = await controller.createMovie(createRequest as any);

      expect(result).toEqual(expectedResult);
      expect(mockMovieService.createMovie).toHaveBeenCalledWith(createRequest);
    });
  });

  describe('updateMovie', () => {
    it('should call movieService.updateMovie with correct parameters', async () => {
      const movieId = 'update-movie-id';
      const updateRequest = {
        title: 'Updated Movie Title',
        overview: 'Updated movie overview',
        runtime: 180,
        genreIds: ['genre3', 'genre4'],
      };

      const payload = {
        id: movieId,
        updateMovieRequest: updateRequest,
      };

      const expectedResult = {
        data: {
          id: movieId,
          title: 'Updated Movie Title',
          originalTitle: 'Updated Original Title',
          overview: 'Updated movie overview',
          posterUrl: 'updated-poster.jpg',
          trailerUrl: 'updated-trailer.mp4',
          backdropUrl: 'updated-backdrop.jpg',
          runtime: 180,
          releaseDate: new Date('2024-01-01'),
          ageRating: '' as any,
          originalLanguage: 'en',
          spokenLanguages: ['en', 'fr'],
          languageType: '' as any,
          productionCountry: 'FR',
          director: 'Updated Director',
          cast: [{ name: 'Updated Actor 1', character: 'Updated Character 1' }],
          genre: [
            { id: 'genre3', name: 'Horror' },
            { id: 'genre4', name: 'Thriller' },
          ],
        },
        message: 'Update movie successfully!',
      };

      mockMovieService.updateMovie.mockResolvedValue(expectedResult);

      const result = await controller.updateMovie(payload);

      expect(result).toEqual(expectedResult);
      expect(mockMovieService.updateMovie).toHaveBeenCalledWith(
        movieId,
        updateRequest
      );
      expect(mockMovieService.updateMovie).toHaveBeenCalledTimes(1);
    });

    it('should handle partial update with only title', async () => {
      const movieId = 'partial-update-id';
      const updateRequest = {
        title: 'Only Title Updated',
      };

      const payload = {
        id: movieId,
        updateMovieRequest: updateRequest,
      };

      const expectedResult = {
        data: {
          id: movieId,
          title: 'Only Title Updated',
          originalTitle: 'Original Title',
          overview: 'Original overview',
          posterUrl: 'original-poster.jpg',
          trailerUrl: 'original-trailer.mp4',
          backdropUrl: 'original-backdrop.jpg',
          runtime: 120,
          releaseDate: new Date('2024-01-01'),
          ageRating: '' as any,
          originalLanguage: 'en',
          spokenLanguages: ['en'],
          languageType: '' as any,
          productionCountry: 'US',
          director: 'Original Director',
          cast: [{ name: 'Original Actor' }],
          genre: [{ id: 'genre1', name: 'Original Genre' }],
        },
        message: 'Update movie successfully!',
      };

      mockMovieService.updateMovie.mockResolvedValue(expectedResult);

      const result = await controller.updateMovie(payload);

      expect(result).toEqual(expectedResult);
      expect(mockMovieService.updateMovie).toHaveBeenCalledWith(
        movieId,
        updateRequest
      );
    });
  });

  describe('deleteMovie', () => {
    it('should call movieService.deleteMovie with correct movie ID', async () => {
      const movieId = 'delete-movie-id';
      const expectedResult = {
        message: 'Delete movie successfully!',
      };

      mockMovieService.deleteMovie.mockResolvedValue(expectedResult);

      const result = await controller.deleteMovie(movieId);

      expect(result).toEqual(expectedResult);
      expect(mockMovieService.deleteMovie).toHaveBeenCalledWith(movieId);
      expect(mockMovieService.deleteMovie).toHaveBeenCalledTimes(1);
    });

    it('should handle deletion of non-existent movie', async () => {
      const movieId = 'non-existent-movie-id';

      mockMovieService.deleteMovie.mockRejectedValue(
        new Error('Movie not found')
      );

      await expect(controller.deleteMovie(movieId)).rejects.toThrow(
        'Movie not found'
      );
      expect(mockMovieService.deleteMovie).toHaveBeenCalledWith(movieId);
    });
  });

  describe('Message Pattern Decorators', () => {
    it('should have correct message patterns for each method', () => {
      const getMoviesPattern = Reflect.getMetadata(
        'microservices:pattern',
        controller.getMovies
      );
      const getDetailPattern = Reflect.getMetadata(
        'microservices:pattern',
        controller.getDetail
      );
      const createMoviePattern = Reflect.getMetadata(
        'microservices:pattern',
        controller.createMovie
      );
      const updateMoviePattern = Reflect.getMetadata(
        'microservices:pattern',
        controller.updateMovie
      );
      const deleteMoviePattern = Reflect.getMetadata(
        'microservices:pattern',
        controller.deleteMovie
      );

      // Patterns might be wrapped in arrays by NestJS microservices decorator
      expect(getMoviesPattern).toEqual(
        expect.arrayContaining([MovieServiceMessage.MOVIE.GET_LIST])
      );
      expect(getDetailPattern).toEqual(
        expect.arrayContaining([MovieServiceMessage.MOVIE.GET_DETAIL])
      );
      expect(createMoviePattern).toEqual(
        expect.arrayContaining([MovieServiceMessage.MOVIE.CREATED])
      );
      expect(updateMoviePattern).toEqual(
        expect.arrayContaining([MovieServiceMessage.MOVIE.UPDATED])
      );
      expect(deleteMoviePattern).toEqual(
        expect.arrayContaining([MovieServiceMessage.MOVIE.DELETED])
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors in getMovies', async () => {
      const mockQuery: MovieQuery = { page: 1, limit: 10 };
      const serviceError = new Error('Database connection failed');

      mockMovieService.getMovies.mockRejectedValue(serviceError);

      await expect(controller.getMovies(mockQuery)).rejects.toThrow(
        'Database connection failed'
      );
      expect(mockMovieService.getMovies).toHaveBeenCalledWith(mockQuery);
    });

    it('should handle service errors in getDetail', async () => {
      const movieId = 'error-movie-id';
      const serviceError = new Error('Movie not found');

      mockMovieService.getMovieDetail.mockRejectedValue(serviceError);

      await expect(controller.getDetail(movieId)).rejects.toThrow(
        'Movie not found'
      );
      expect(mockMovieService.getMovieDetail).toHaveBeenCalledWith(movieId);
    });

    it('should handle service errors in createMovie', async () => {
      const createRequest = {
        title: 'Error Movie',
        originalTitle: 'Error Original Movie',
        overview: 'A movie that will cause an error',
        posterUrl: 'error-poster.jpg',
        trailerUrl: 'error-trailer.mp4',
        backdropUrl: 'error-backdrop.jpg',
        runtime: 120,
        releaseDate: new Date('2024-01-01'),
        ageRating: '' as any,
        originalLanguage: 'en',
        spokenLanguages: ['en'],
        languageType: '' as any,
        productionCountry: 'US',
        director: 'Error Director',
        cast: [{ name: 'Error Actor' }],
        genreIds: ['genre1'],
      };
      const serviceError = new Error('Validation failed');

      mockMovieService.createMovie.mockRejectedValue(serviceError);

      await expect(controller.createMovie(createRequest)).rejects.toThrow(
        'Validation failed'
      );
      expect(mockMovieService.createMovie).toHaveBeenCalledWith(createRequest);
    });

    it('should handle service errors in updateMovie', async () => {
      const payload = {
        id: 'error-update-id',
        updateMovieRequest: { title: 'Error Update' },
      };
      const serviceError = new Error('Update failed');

      mockMovieService.updateMovie.mockRejectedValue(serviceError);

      await expect(controller.updateMovie(payload)).rejects.toThrow(
        'Update failed'
      );
      expect(mockMovieService.updateMovie).toHaveBeenCalledWith(
        payload.id,
        payload.updateMovieRequest
      );
    });
  });
});
