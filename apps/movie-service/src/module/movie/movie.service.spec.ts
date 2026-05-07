import { Test, TestingModule } from '@nestjs/testing';
import { MovieService } from './movie.service';
import { PrismaService } from '../prisma/prisma.service';
import { MovieQuery, ResourceNotFoundException } from '@movie-hub/shared-types';
import { MovieMapper } from './movie.mapper';

// Mock the MovieMapper
jest.mock('./movie.mapper', () => ({
  MovieMapper: {
    toMovie: jest.fn(),
    toResponse: jest.fn(),
  },
}));

const MockedMovieMapper = MovieMapper as jest.Mocked<typeof MovieMapper>;

describe('MovieService', () => {
  let service: MovieService;

  const mockPrismaService = {
    movie: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    movieGenre: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MovieService>(MovieService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMovies', () => {
    const mockMovies = [
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
      {
        id: '2',
        title: 'Test Movie 2',
        posterUrl: 'test-poster2.jpg',
        backdropUrl: 'test-backdrop2.jpg',
        runtime: 90,
        ageRating: '' as any,
        productionCountry: 'US',
        languageType: '' as any,
      },
    ];

    it('should return movies with pagination metadata when limit is provided', async () => {
      const mockQuery: MovieQuery = { page: 1, limit: 10 };

      mockPrismaService.movie.findMany.mockResolvedValue(mockMovies);
      mockPrismaService.movie.count.mockResolvedValue(2);

      const result = await service.getMovies(mockQuery);

      expect(result.data).toEqual(mockMovies);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        totalRecords: 2,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      });
      expect(mockPrismaService.movie.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          id: true,
          title: true,
          posterUrl: true,
          backdropUrl: true,
          runtime: true,
          ageRating: true,
          productionCountry: true,
          languageType: true,
        },
        orderBy: {
          undefined: undefined,
        },
        skip: 0,
        take: 10,
      });
      expect(mockPrismaService.movie.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should return movies without pagination metadata when limit is not provided', async () => {
      const mockQuery: MovieQuery = {};

      mockPrismaService.movie.findMany.mockResolvedValue(mockMovies);

      const result = await service.getMovies(mockQuery);

      expect(result.data).toEqual(mockMovies);
      expect(result.meta).toBeNull();
      expect(mockPrismaService.movie.count).not.toHaveBeenCalled();
    });

    it('should filter movies by "now_show" status', async () => {
      const mockQuery: MovieQuery = { status: 'now_show' };
      const fixedDate = new Date('2025-10-25T14:11:16.126Z');

      // Mock Date constructor to return fixed date
      const originalDate = global.Date;
      // Mock Date constructor to return fixed date
      global.Date = jest.fn(() => fixedDate) as unknown as DateConstructor;
      (global.Date as unknown as typeof originalDate).now = originalDate.now;

      mockPrismaService.movie.findMany.mockResolvedValue(mockMovies);

      try {
        await service.getMovies(mockQuery);

        expect(mockPrismaService.movie.findMany).toHaveBeenCalledWith({
          where: {
            movieReleases: {
              some: {
                startDate: { lte: fixedDate },
                OR: [{ endDate: { gte: fixedDate } }, { endDate: null }],
              },
            },
          },
          select: {
            id: true,
            title: true,
            posterUrl: true,
            backdropUrl: true,
            runtime: true,
            ageRating: true,
            productionCountry: true,
            languageType: true,
          },
          orderBy: {
            undefined: undefined,
          },
          skip: 0,
          take: undefined,
        });
      } finally {
        // Restore original Date
        global.Date = originalDate;
      }
    });

    it('should filter movies by "upcoming" status', async () => {
      const mockQuery: MovieQuery = { status: 'upcoming' };

      mockPrismaService.movie.findMany.mockResolvedValue(mockMovies);

      await service.getMovies(mockQuery);

      expect(mockPrismaService.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            movieReleases: {
              some: {
                startDate: { gt: expect.any(Date) },
              },
            },
          },
          select: {
            id: true,
            title: true,
            posterUrl: true,
            backdropUrl: true,
            runtime: true,
            ageRating: true,
            productionCountry: true,
            languageType: true,
          },
          orderBy: {
            undefined: undefined,
          },
          skip: 0,
          take: undefined,
        })
      );
    });

    it('should handle sorting parameters', async () => {
      const mockQuery: MovieQuery = { sortBy: 'title', sortOrder: 'asc' };

      mockPrismaService.movie.findMany.mockResolvedValue(mockMovies);

      await service.getMovies(mockQuery);

      expect(mockPrismaService.movie.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          id: true,
          title: true,
          posterUrl: true,
          backdropUrl: true,
          runtime: true,
          ageRating: true,
          productionCountry: true,
          languageType: true,
        },
        orderBy: {
          title: 'asc',
        },
        skip: 0,
        take: undefined,
      });
    });

    it('should calculate pagination correctly for multiple pages', async () => {
      const mockQuery: MovieQuery = { page: 2, limit: 5 };

      mockPrismaService.movie.findMany.mockResolvedValue(mockMovies);
      mockPrismaService.movie.count.mockResolvedValue(12);

      const result = await service.getMovies(mockQuery);

      expect(result.meta).toEqual({
        page: 2,
        limit: 5,
        totalRecords: 12,
        totalPages: 3,
        hasPrev: true,
        hasNext: true,
      });
      expect(mockPrismaService.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe('getMovieDetail', () => {
    it('should return movie detail with genres', async () => {
      const mockMovie = {
        id: '1',
        title: 'Test Movie',
        originalTitle: 'Original Test Movie',
        overview: 'A test movie',
        posterUrl: 'test-poster.jpg',
        backdropUrl: 'test-backdrop.jpg',
        runtime: 120,
        ageRating: '' as any,
        productionCountry: 'US',
        languageType: '' as any,
        movieGenres: [
          {
            genre: {
              id: 'genre1',
              name: 'Action',
            },
          },
        ],
      };

      const mockResponse = {
        id: '1',
        title: 'Test Movie',
        genre: [{ id: 'genre1', name: 'Action' }],
      };

      mockPrismaService.movie.findUnique.mockResolvedValue(mockMovie);
      MockedMovieMapper.toResponse.mockReturnValue(mockResponse as any);

      const result = await service.getMovieDetail('1');

      expect(result.data).toEqual(mockResponse);
      expect(mockPrismaService.movie.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          movieGenres: {
            include: {
              genre: true,
            },
          },
        },
      });
      expect(MockedMovieMapper.toResponse).toHaveBeenCalledWith(mockMovie);
    });

    it('should return movie detail when movie has no genres', async () => {
      const mockMovie = {
        id: '1',
        title: 'Test Movie',
        movieGenres: [],
      };

      const mockResponse = {
        id: '1',
        title: 'Test Movie',
        genre: [],
      };

      mockPrismaService.movie.findUnique.mockResolvedValue(mockMovie);
      MockedMovieMapper.toResponse.mockReturnValue(mockResponse as any);

      const result = await service.getMovieDetail('1');

      expect(result.data).toEqual(mockResponse);
      expect(MockedMovieMapper.toResponse).toHaveBeenCalledWith(mockMovie);
    });
  });

  describe('createMovie', () => {
    it('should create a movie successfully', async () => {
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
        director: 'Test Director',
        cast: [{ name: 'Actor 1', character: 'Character 1' }],
        genreIds: ['genre1', 'genre2'],
      };

      const mockMovieData = {
        title: 'New Movie',
        originalTitle: 'New Original Movie',
        overview: 'A new movie',
        posterUrl: 'new-poster.jpg',
        runtime: 150,
        ageRating: '' as any,
        movieGenres: {
          create: [{ genreId: 'genre1' }, { genreId: 'genre2' }],
        },
      };

      const mockCreatedMovie = {
        id: 'new-id',
        title: 'New Movie',
        movieGenres: [
          { genre: { id: 'genre1', name: 'Action' } },
          { genre: { id: 'genre2', name: 'Drama' } },
        ],
      };

      const mockResponse = {
        id: 'new-id',
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
        director: 'Test Director',
        cast: [{ name: 'Actor 1', character: 'Character 1' }],
        genre: [
          { id: 'genre1', name: 'Action' },
          { id: 'genre2', name: 'Drama' },
        ],
      };

      MockedMovieMapper.toMovie.mockReturnValue(mockMovieData);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          movie: {
            create: jest.fn().mockResolvedValue(mockCreatedMovie),
          },
        });
      });
      MockedMovieMapper.toResponse.mockReturnValue(mockResponse as any);

      const result = await service.createMovie(createRequest);

      expect(result.data).toEqual(mockResponse);
      expect(result.message).toBe('Create movie successfully!');
      expect(MockedMovieMapper.toMovie).toHaveBeenCalledWith(createRequest);
      expect(MockedMovieMapper.toResponse).toHaveBeenCalledWith(
        mockCreatedMovie
      );
    });

    it('should create a movie without genres', async () => {
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
        spokenLanguages: ['en'],
        languageType: '' as any,
        productionCountry: 'US',
        director: 'Test Director',
        cast: [{ name: 'Actor 1' }],
        genreIds: ['genre1'],
      };

      const mockMovieData = {
        title: 'New Movie',
        overview: 'A new movie',
        runtime: 150,
      };

      const mockCreatedMovie = {
        id: 'new-id',
        title: 'New Movie',
        movieGenres: [],
      };

      const mockResponse = {
        id: 'new-id',
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
        spokenLanguages: ['en'],
        languageType: '' as any,
        productionCountry: 'US',
        director: 'Test Director',
        cast: [{ name: 'Actor 1' }],
        genre: [],
      };

      MockedMovieMapper.toMovie.mockReturnValue(mockMovieData);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          movie: {
            create: jest.fn().mockResolvedValue(mockCreatedMovie),
          },
        });
      });
      MockedMovieMapper.toResponse.mockReturnValue(mockResponse as any);

      const result = await service.createMovie(createRequest);

      expect(result.message).toBe('Create movie successfully!');
      expect(MockedMovieMapper.toMovie).toHaveBeenCalledWith(createRequest);
    });
  });

  describe('updateMovie', () => {
    it('should update a movie successfully', async () => {
      const movieId = '1';
      const updateRequest = {
        title: 'Updated Movie',
        overview: 'Updated overview',
        genreIds: ['genre1', 'genre3'],
      };

      const mockExistingMovie = {
        id: '1',
        title: 'Original Movie',
      };

      const mockUpdatedMovie = {
        id: '1',
        title: 'Updated Movie',
        overview: 'Updated overview',
        movieGenres: [
          { genre: { id: 'genre1', name: 'Action' } },
          { genre: { id: 'genre3', name: 'Comedy' } },
        ],
      };

      const mockResponse = {
        id: '1',
        title: 'Updated Movie',
        originalTitle: 'Updated Original Movie',
        overview: 'Updated overview',
        posterUrl: 'updated-poster.jpg',
        trailerUrl: 'updated-trailer.mp4',
        backdropUrl: 'updated-backdrop.jpg',
        runtime: 150,
        releaseDate: new Date('2024-01-01'),
        ageRating: '' as any,
        originalLanguage: 'en',
        spokenLanguages: ['en'],
        languageType: '' as any,
        productionCountry: 'US',
        director: 'Updated Director',
        cast: [{ name: 'Updated Actor 1', character: 'Updated Character 1' }],
        genre: [
          { id: 'genre1', name: 'Action' },
          { id: 'genre3', name: 'Comedy' },
        ],
      };

      mockPrismaService.movie.findUnique.mockResolvedValue(mockExistingMovie);
      MockedMovieMapper.toMovie.mockReturnValue({
        title: 'Updated Movie',
        overview: 'Updated overview',
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockDb = {
          movieGenre: {
            deleteMany: jest.fn(),
          },
          movie: {
            update: jest.fn().mockResolvedValue(mockUpdatedMovie),
          },
        };
        return callback(mockDb);
      });
      MockedMovieMapper.toResponse.mockReturnValue(mockResponse as any);

      const result = await service.updateMovie(movieId, updateRequest);

      expect(result.data).toEqual(mockResponse);
      expect(result.message).toBe('Update movie successfully!');
      expect(mockPrismaService.movie.findUnique).toHaveBeenCalledWith({
        where: { id: movieId },
      });
      expect(MockedMovieMapper.toMovie).toHaveBeenCalledWith(updateRequest);
      expect(MockedMovieMapper.toResponse).toHaveBeenCalledWith(
        mockUpdatedMovie
      );
    });

    it('should throw ResourceNotFoundException when movie does not exist', async () => {
      const movieId = 'non-existent';
      const updateRequest = {
        title: 'Updated Movie',
      };

      mockPrismaService.movie.findUnique.mockResolvedValue(null);

      await expect(service.updateMovie(movieId, updateRequest)).rejects.toThrow(
        ResourceNotFoundException
      );
      expect(mockPrismaService.movie.findUnique).toHaveBeenCalledWith({
        where: { id: movieId },
      });
    });

    it('should update movie without deleting genres when genreIds is not provided', async () => {
      const movieId = '1';
      const updateRequest = {
        title: 'Updated Movie',
        overview: 'Updated overview',
      };

      const mockExistingMovie = {
        id: '1',
        title: 'Original Movie',
      };

      const mockUpdatedMovie = {
        id: '1',
        title: 'Updated Movie',
        overview: 'Updated overview',
        movieGenres: [],
      };

      mockPrismaService.movie.findUnique.mockResolvedValue(mockExistingMovie);
      MockedMovieMapper.toMovie.mockReturnValue({
        title: 'Updated Movie',
        overview: 'Updated overview',
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const mockDb = {
          movieGenre: {
            deleteMany: jest.fn(),
          },
          movie: {
            update: jest.fn().mockResolvedValue(mockUpdatedMovie),
          },
        };
        return callback(mockDb);
      });
      MockedMovieMapper.toResponse.mockReturnValue({
        id: '1',
        title: 'Updated Movie',
        originalTitle: 'Updated Original Movie',
        overview: 'Updated overview',
        posterUrl: 'updated-poster.jpg',
        trailerUrl: 'updated-trailer.mp4',
        backdropUrl: 'updated-backdrop.jpg',
        runtime: 150,
        releaseDate: new Date('2024-01-01'),
        ageRating: 'T13' as any,
        originalLanguage: 'en',
        spokenLanguages: ['en'],
        languageType: 'ORIGINAL' as any,
        productionCountry: 'US',
        director: 'Updated Director',
        cast: [{ name: 'Updated Actor 1' }],
        genre: [],
      } as any);

      await service.updateMovie(movieId, updateRequest);

      // Verify that deleteMany was not called since genreIds was not provided
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('deleteMovie', () => {
    it('should delete a movie successfully', async () => {
      const movieId = '1';

      mockPrismaService.movie.delete.mockResolvedValue({});

      const result = await service.deleteMovie(movieId);

      expect(result.message).toBe('Delete movie successfully!');
      expect(mockPrismaService.movie.delete).toHaveBeenCalledWith({
        where: { id: movieId },
      });
    });

    it('should handle delete operation even if movie does not exist', async () => {
      const movieId = 'non-existent';

      mockPrismaService.movie.delete.mockRejectedValue(
        new Error('Movie not found')
      );

      await expect(service.deleteMovie(movieId)).rejects.toThrow(
        'Movie not found'
      );
      expect(mockPrismaService.movie.delete).toHaveBeenCalledWith({
        where: { id: movieId },
      });
    });
  });
});
