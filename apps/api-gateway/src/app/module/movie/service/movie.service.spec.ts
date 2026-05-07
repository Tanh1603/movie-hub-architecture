import { Test, TestingModule } from '@nestjs/testing';
import { MovieService } from './movie.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import {
  SERVICE_NAME,
  MovieServiceMessage,
  CreateMovieRequest,
} from '@movie-hub/shared-types';
import { of, throwError } from 'rxjs';

describe('MovieService', () => {
  let service: MovieService;
  let clientProxy: jest.Mocked<ClientProxy>;

  const mockClientProxy = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieService,
        {
          provide: SERVICE_NAME.Movie,
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    service = module.get<MovieService>(MovieService);
    clientProxy = module.get(SERVICE_NAME.Movie);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMovies', () => {
    it('should proxy the request to movie microservice', async () => {
      const mockQuery = { page: 1, limit: 10 };
      const mockResponse = { data: [], meta: { page: 1, limit: 10 } };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.getMovies(mockQuery);

      expect(clientProxy.send).toHaveBeenCalledWith(
        MovieServiceMessage.MOVIE.GET_LIST,
        mockQuery
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw RpcException when microservice fails', async () => {
      const mockQuery = { page: 1, limit: 10 };
      const mockError = new Error('Service unavailable');

      clientProxy.send.mockReturnValue(throwError(() => mockError));

      await expect(service.getMovies(mockQuery)).rejects.toThrow(RpcException);
      expect(clientProxy.send).toHaveBeenCalledWith(
        MovieServiceMessage.MOVIE.GET_LIST,
        mockQuery
      );
    });

    it('should handle empty query parameters', async () => {
      const mockQuery = {};
      const mockResponse = { data: [] };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.getMovies(mockQuery);

      expect(clientProxy.send).toHaveBeenCalledWith(
        MovieServiceMessage.MOVIE.GET_LIST,
        mockQuery
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMovieDetail', () => {
    it('should proxy the request to get movie detail', async () => {
      const movieId = '123';
      const mockResponse = { data: { id: movieId, title: 'Test Movie' } };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.getMovieDetail(movieId);

      expect(clientProxy.send).toHaveBeenCalledWith(
        MovieServiceMessage.MOVIE.GET_DETAIL,
        movieId
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw RpcException when movie not found', async () => {
      const movieId = 'non-existent';
      const mockError = new Error('Movie not found');

      clientProxy.send.mockReturnValue(throwError(() => mockError));

      await expect(service.getMovieDetail(movieId)).rejects.toThrow(
        RpcException
      );
      expect(clientProxy.send).toHaveBeenCalledWith(
        MovieServiceMessage.MOVIE.GET_DETAIL,
        movieId
      );
    });
  });

  describe('createMovie', () => {
    it('should proxy create movie request', async () => {
      const createRequest: CreateMovieRequest = {
        title: 'New Movie',
        overview: 'Test overview',
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
      const mockResponse = { data: { id: '456', ...createRequest } };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.createMovie(createRequest);

      expect(clientProxy.send).toHaveBeenCalledWith(
        MovieServiceMessage.MOVIE.CREATED,
        createRequest
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle validation errors from microservice', async () => {
      const createRequest: CreateMovieRequest = {
        title: '',
        overview: 'Test overview',
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
        genreIds: ['1', '2'],
      }; // Invalid request
      const mockError = new Error('Validation failed');

      clientProxy.send.mockReturnValue(throwError(() => mockError));

      await expect(service.createMovie(createRequest)).rejects.toThrow(
        RpcException
      );
    });
  });

  describe('updateMovie', () => {
    it('should proxy update movie request with ID', async () => {
      const movieId = '123';
      const updateRequest = { title: 'Updated Movie' };
      const mockResponse = { data: { id: movieId, ...updateRequest } };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.updateMovie(movieId, updateRequest);

      expect(clientProxy.send).toHaveBeenCalledWith(
        MovieServiceMessage.MOVIE.UPDATED,
        { id: movieId, updateMovieRequest: updateRequest }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw RpcException when update fails', async () => {
      const movieId = '123';
      const updateRequest = { title: 'Updated Movie' };
      const mockError = new Error('Update failed');

      clientProxy.send.mockReturnValue(throwError(() => mockError));

      await expect(service.updateMovie(movieId, updateRequest)).rejects.toThrow(
        RpcException
      );
    });
  });

  describe('deleteMovie', () => {
    it('should proxy delete movie request', async () => {
      const movieId = '123';
      const mockResponse = { message: 'Movie deleted successfully' };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.deleteMovie(movieId);

      expect(clientProxy.send).toHaveBeenCalledWith(
        MovieServiceMessage.MOVIE.DELETED,
        movieId
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw RpcException when delete fails', async () => {
      const movieId = '123';
      const mockError = new Error('Delete failed');

      clientProxy.send.mockReturnValue(throwError(() => mockError));

      await expect(service.deleteMovie(movieId)).rejects.toThrow(RpcException);
    });
  });
});
