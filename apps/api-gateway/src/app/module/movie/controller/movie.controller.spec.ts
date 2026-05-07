import { Test, TestingModule } from '@nestjs/testing';
import { MovieController } from './movie.controller';
import { MovieService } from '../service/movie.service';
import {
  CreateMovieRequest,
  UpdateMovieRequest,
} from '@movie-hub/shared-types';

describe('MovieController', () => {
  let controller: MovieController;
  let movieService: jest.Mocked<MovieService>;

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
    movieService = module.get(MovieService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMovies', () => {
    it('should return movies with query parameters', async () => {
      const mockQuery = { page: 1, limit: 10, status: 'now_show' };
      const mockResult = {
        data: [
          { id: '1', title: 'Movie 1' },
          { id: '2', title: 'Movie 2' },
        ],
        meta: { page: 1, limit: 10, totalRecords: 2 },
      };

      movieService.getMovies.mockResolvedValue(mockResult);

      const result = await controller.getMovies(mockQuery);

      expect(movieService.getMovies).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(mockResult);
    });

    it('should handle empty query parameters', async () => {
      const mockQuery = {};
      const mockResult = { data: [] };

      movieService.getMovies.mockResolvedValue(mockResult);

      const result = await controller.getMovies(mockQuery);

      expect(movieService.getMovies).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(mockResult);
    });

    it('should pass through service errors', async () => {
      const mockQuery = { page: 1 };
      const error = new Error('Service error');

      movieService.getMovies.mockRejectedValue(error);

      await expect(controller.getMovies(mockQuery)).rejects.toThrow(error);
      expect(movieService.getMovies).toHaveBeenCalledWith(mockQuery);
    });
  });

  describe('findOne', () => {
    it('should return a movie by ID', async () => {
      const movieId = '123';
      const mockResult = {
        data: {
          id: movieId,
          title: 'Test Movie',
          description: 'Test Description',
        },
      };

      movieService.getMovieDetail.mockResolvedValue(mockResult);

      const result = await controller.findOne(movieId);

      expect(movieService.getMovieDetail).toHaveBeenCalledWith(movieId);
      expect(result).toEqual(mockResult);
    });

    it('should handle non-existent movie ID', async () => {
      const movieId = 'non-existent';
      const error = new Error('Movie not found');

      movieService.getMovieDetail.mockRejectedValue(error);

      await expect(controller.findOne(movieId)).rejects.toThrow(error);
      expect(movieService.getMovieDetail).toHaveBeenCalledWith(movieId);
    });
  });

  describe('createMovie', () => {
    it('should create a new movie', async () => {
      const createRequest: CreateMovieRequest = {
        title: 'New Movie',
        overview: 'New Overview',
        originalTitle: 'Original New Movie',
        posterUrl: 'https://example.com/poster.jpg',
        trailerUrl: 'https://example.com/trailer.mp4',
        backdropUrl: 'https://example.com/backdrop.jpg',
        runtime: 120,
        releaseDate: new Date('2024-01-01'),
        ageRating: 'PG_13' as any,
        originalLanguage: 'en',
        spokenLanguages: ['en'],
        languageType: 'ORIGINAL' as any,
        productionCountry: 'US',
        director: 'John Director',
        cast: [{ name: 'Actor 1', character: 'Character 1' }],
        genreIds: ['1', '2'],
      };
      const mockResult = {
        data: { id: '456', ...createRequest },
        message: 'Movie created successfully',
      };

      movieService.createMovie.mockResolvedValue(mockResult);

      const result = await controller.createMovie(createRequest);

      expect(movieService.createMovie).toHaveBeenCalledWith(createRequest);
      expect(result).toEqual(mockResult);
    });

    it('should handle validation errors', async () => {
      const createRequest: CreateMovieRequest = {
        title: '',
        overview: 'Overview',
        originalTitle: 'Original Title',
        posterUrl: 'https://example.com/poster.jpg',
        trailerUrl: 'https://example.com/trailer.mp4',
        backdropUrl: 'https://example.com/backdrop.jpg',
        runtime: 120,
        releaseDate: new Date('2024-01-01'),
        ageRating: 'PG_13' as any,
        originalLanguage: 'en',
        spokenLanguages: ['en'],
        languageType: 'ORIGINAL' as any,
        productionCountry: 'US',
        director: 'John Director',
        cast: [{ name: 'Actor 1', character: 'Character 1' }],
        genreIds: [],
      };
      const error = new Error('Validation failed: title is required');

      movieService.createMovie.mockRejectedValue(error);

      await expect(controller.createMovie(createRequest)).rejects.toThrow(
        error
      );
      expect(movieService.createMovie).toHaveBeenCalledWith(createRequest);
    });
  });

  describe('updateMovie', () => {
    it('should update an existing movie', async () => {
      const movieId = '123';
      const updateRequest: UpdateMovieRequest = {
        title: 'Updated Movie',
        overview: 'Updated Overview',
      };
      const mockResult = {
        data: { id: movieId, ...updateRequest },
        message: 'Movie updated successfully',
      };

      movieService.updateMovie.mockResolvedValue(mockResult);

      const result = await controller.updateMovie(movieId, updateRequest);

      expect(movieService.updateMovie).toHaveBeenCalledWith(
        movieId,
        updateRequest
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle non-existent movie for update', async () => {
      const movieId = 'non-existent';
      const updateRequest: UpdateMovieRequest = { title: 'Updated Title' };
      const error = new Error('Movie not found');

      movieService.updateMovie.mockRejectedValue(error);

      await expect(
        controller.updateMovie(movieId, updateRequest)
      ).rejects.toThrow(error);
      expect(movieService.updateMovie).toHaveBeenCalledWith(
        movieId,
        updateRequest
      );
    });
  });

  describe('remove', () => {
    it('should delete a movie and return null', async () => {
      const movieId = '123';
      const mockResult = { message: 'Movie deleted successfully' };

      movieService.deleteMovie.mockResolvedValue(mockResult);

      const result = await controller.remove(movieId);

      expect(movieService.deleteMovie).toHaveBeenCalledWith(movieId);
      expect(result).toBeNull();
    });

    it('should handle delete errors', async () => {
      const movieId = '123';
      const error = new Error('Delete failed');

      movieService.deleteMovie.mockRejectedValue(error);

      await expect(controller.remove(movieId)).rejects.toThrow(error);
      expect(movieService.deleteMovie).toHaveBeenCalledWith(movieId);
    });

    it('should handle non-existent movie for delete', async () => {
      const movieId = 'non-existent';
      const error = new Error('Movie not found');

      movieService.deleteMovie.mockRejectedValue(error);

      await expect(controller.remove(movieId)).rejects.toThrow(error);
      expect(movieService.deleteMovie).toHaveBeenCalledWith(movieId);
    });
  });
});
