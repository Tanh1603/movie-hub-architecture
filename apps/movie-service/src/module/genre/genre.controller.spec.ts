import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import {
  GenreRequest,
  GenreResponse,
  MovieServiceMessage,
} from '@movie-hub/shared-types';

describe('GenreController', () => {
  let controller: GenreController;

  const mockGenreService = {
    createGenre: jest.fn(),
    getGenres: jest.fn(),
    findGenreById: jest.fn(),
    updateGenre: jest.fn(),
    deleteGenre: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenreController],
      providers: [
        {
          provide: GenreService,
          useValue: mockGenreService,
        },
      ],
    }).compile();

    controller = module.get<GenreController>(GenreController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGenre', () => {
    it('should call genreService.createGenre with correct parameters', async () => {
      const createRequest: GenreRequest = {
        name: 'Action',
      };

      const expectedResult = {
        data: {
          id: 'genre-id-1',
          name: 'Action',
        } as GenreResponse,
        message: 'Create genre successfully!',
      };

      mockGenreService.createGenre.mockResolvedValue(expectedResult);

      const result = await controller.createGenre(createRequest);

      expect(result).toEqual(expectedResult);
      expect(mockGenreService.createGenre).toHaveBeenCalledWith(createRequest);
      expect(mockGenreService.createGenre).toHaveBeenCalledTimes(1);
    });

    it('should handle creation with special characters in name', async () => {
      const createRequest: GenreRequest = {
        name: 'Sci-Fi & Fantasy',
      };

      const expectedResult = {
        data: {
          id: 'genre-id-2',
          name: 'Sci-Fi & Fantasy',
        } as GenreResponse,
        message: 'Create genre successfully!',
      };

      mockGenreService.createGenre.mockResolvedValue(expectedResult);

      const result = await controller.createGenre(createRequest);

      expect(result).toEqual(expectedResult);
      expect(mockGenreService.createGenre).toHaveBeenCalledWith(createRequest);
    });

    it('should handle creation with long genre name', async () => {
      const createRequest: GenreRequest = {
        name: 'Historical Drama and Documentary',
      };

      const expectedResult = {
        data: {
          id: 'genre-id-3',
          name: 'Historical Drama and Documentary',
        } as GenreResponse,
        message: 'Create genre successfully!',
      };

      mockGenreService.createGenre.mockResolvedValue(expectedResult);

      const result = await controller.createGenre(createRequest);

      expect(result).toEqual(expectedResult);
      expect(mockGenreService.createGenre).toHaveBeenCalledWith(createRequest);
    });

    it('should handle service errors during creation', async () => {
      const createRequest: GenreRequest = {
        name: 'Horror',
      };

      const serviceError = new Error('Genre already exists');
      mockGenreService.createGenre.mockRejectedValue(serviceError);

      await expect(controller.createGenre(createRequest)).rejects.toThrow(
        'Genre already exists'
      );
      expect(mockGenreService.createGenre).toHaveBeenCalledWith(createRequest);
    });
  });

  describe('getGenres', () => {
    it('should call genreService.getGenres and return all genres', async () => {
      const expectedResult = {
        data: [
          { id: 'genre-1', name: 'Action' },
          { id: 'genre-2', name: 'Comedy' },
          { id: 'genre-3', name: 'Drama' },
          { id: 'genre-4', name: 'Horror' },
          { id: 'genre-5', name: 'Romance' },
        ] as GenreResponse[],
      };

      mockGenreService.getGenres.mockResolvedValue(expectedResult);

      const result = await controller.getGenres();

      expect(result).toEqual(expectedResult);
      expect(result.data).toHaveLength(5);
      expect(mockGenreService.getGenres).toHaveBeenCalledWith();
      expect(mockGenreService.getGenres).toHaveBeenCalledTimes(1);
    });

    it('should handle empty genres list', async () => {
      const expectedResult = {
        data: [] as GenreResponse[],
      };

      mockGenreService.getGenres.mockResolvedValue(expectedResult);

      const result = await controller.getGenres();

      expect(result).toEqual(expectedResult);
      expect(result.data).toHaveLength(0);
      expect(mockGenreService.getGenres).toHaveBeenCalledWith();
    });

    it('should handle single genre in database', async () => {
      const expectedResult = {
        data: [{ id: 'genre-1', name: 'Documentary' }] as GenreResponse[],
      };

      mockGenreService.getGenres.mockResolvedValue(expectedResult);

      const result = await controller.getGenres();

      expect(result).toEqual(expectedResult);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Documentary');
      expect(mockGenreService.getGenres).toHaveBeenCalledWith();
    });

    it('should handle service errors during retrieval', async () => {
      const serviceError = new Error('Database connection failed');
      mockGenreService.getGenres.mockRejectedValue(serviceError);

      await expect(controller.getGenres()).rejects.toThrow(
        'Database connection failed'
      );
      expect(mockGenreService.getGenres).toHaveBeenCalledWith();
    });
  });

  describe('findGenreById', () => {
    it('should call genreService.findGenreById with correct ID', async () => {
      const genreId = 'genre-id-1';
      const expectedResult = {
        data: {
          id: genreId,
          name: 'Thriller',
        } as GenreResponse,
      };

      mockGenreService.findGenreById.mockResolvedValue(expectedResult);

      const result = await controller.findGenreById(genreId);

      expect(result).toEqual(expectedResult);
      expect(mockGenreService.findGenreById).toHaveBeenCalledWith(genreId);
      expect(mockGenreService.findGenreById).toHaveBeenCalledTimes(1);
    });

    it('should handle finding genre with different ID format', async () => {
      const genreId = 'uuid-123-456-789';
      const expectedResult = {
        data: {
          id: genreId,
          name: 'Mystery',
        } as GenreResponse,
      };

      mockGenreService.findGenreById.mockResolvedValue(expectedResult);

      const result = await controller.findGenreById(genreId);

      expect(result).toEqual(expectedResult);
      expect(result.data?.id).toBe(genreId);
      expect(result.data?.name).toBe('Mystery');
      expect(mockGenreService.findGenreById).toHaveBeenCalledWith(genreId);
    });

    it('should handle non-existent genre ID', async () => {
      const genreId = 'non-existent-id';
      const expectedResult = {
        data: null,
      };

      mockGenreService.findGenreById.mockResolvedValue(expectedResult);

      const result = await controller.findGenreById(genreId);

      expect(result).toEqual(expectedResult);
      expect(result.data).toBeNull();
      expect(mockGenreService.findGenreById).toHaveBeenCalledWith(genreId);
    });

    it('should handle service errors during find', async () => {
      const genreId = 'genre-id-1';
      const serviceError = new Error('Genre not found');
      mockGenreService.findGenreById.mockRejectedValue(serviceError);

      await expect(controller.findGenreById(genreId)).rejects.toThrow(
        'Genre not found'
      );
      expect(mockGenreService.findGenreById).toHaveBeenCalledWith(genreId);
    });
  });

  describe('updateGenre', () => {
    it('should call genreService.updateGenre with correct parameters', async () => {
      const genreId = 'genre-id-1';
      const updateRequest: GenreRequest = {
        name: 'Updated Action',
      };

      const payload = {
        id: genreId,
        request: updateRequest,
      };

      const expectedResult = {
        data: {
          id: genreId,
          name: 'Updated Action',
        } as GenreResponse,
        message: 'Update genre successfully!',
      };

      mockGenreService.updateGenre.mockResolvedValue(expectedResult);

      const result = await controller.updateGenre(payload);

      expect(result).toEqual(expectedResult);
      expect(mockGenreService.updateGenre).toHaveBeenCalledWith(
        genreId,
        updateRequest
      );
      expect(mockGenreService.updateGenre).toHaveBeenCalledTimes(1);
    });

    it('should handle update with special characters', async () => {
      const genreId = 'genre-id-2';
      const updateRequest: GenreRequest = {
        name: 'Action & Adventure',
      };

      const payload = {
        id: genreId,
        request: updateRequest,
      };

      const expectedResult = {
        data: {
          id: genreId,
          name: 'Action & Adventure',
        } as GenreResponse,
        message: 'Update genre successfully!',
      };

      mockGenreService.updateGenre.mockResolvedValue(expectedResult);

      const result = await controller.updateGenre(payload);

      expect(result).toEqual(expectedResult);
      expect(mockGenreService.updateGenre).toHaveBeenCalledWith(
        genreId,
        updateRequest
      );
    });

    it('should handle update with same name', async () => {
      const genreId = 'genre-id-3';
      const updateRequest: GenreRequest = {
        name: 'Comedy',
      };

      const payload = {
        id: genreId,
        request: updateRequest,
      };

      const expectedResult = {
        data: {
          id: genreId,
          name: 'Comedy',
        } as GenreResponse,
        message: 'Update genre successfully!',
      };

      mockGenreService.updateGenre.mockResolvedValue(expectedResult);

      const result = await controller.updateGenre(payload);

      expect(result).toEqual(expectedResult);
      expect(mockGenreService.updateGenre).toHaveBeenCalledWith(
        genreId,
        updateRequest
      );
    });

    it('should handle non-existent genre update', async () => {
      const genreId = 'non-existent-id';
      const updateRequest: GenreRequest = {
        name: 'New Genre Name',
      };

      const payload = {
        id: genreId,
        request: updateRequest,
      };

      const serviceError = new Error('Genre not found');
      mockGenreService.updateGenre.mockRejectedValue(serviceError);

      await expect(controller.updateGenre(payload)).rejects.toThrow(
        'Genre not found'
      );
      expect(mockGenreService.updateGenre).toHaveBeenCalledWith(
        genreId,
        updateRequest
      );
    });

    it('should handle service errors during update', async () => {
      const genreId = 'genre-id-1';
      const updateRequest: GenreRequest = {
        name: 'Updated Genre',
      };

      const payload = {
        id: genreId,
        request: updateRequest,
      };

      const serviceError = new Error('Update validation failed');
      mockGenreService.updateGenre.mockRejectedValue(serviceError);

      await expect(controller.updateGenre(payload)).rejects.toThrow(
        'Update validation failed'
      );
      expect(mockGenreService.updateGenre).toHaveBeenCalledWith(
        genreId,
        updateRequest
      );
    });
  });

  describe('deleteGenre', () => {
    it('should call genreService.deleteGenre with correct ID', async () => {
      const genreId = 'genre-id-1';
      const expectedResult = {
        message: 'Delete genre successfully!',
      };

      mockGenreService.deleteGenre.mockResolvedValue(expectedResult);

      const result = await controller.deleteGenre(genreId);

      expect(result).toEqual(expectedResult);
      expect(mockGenreService.deleteGenre).toHaveBeenCalledWith(genreId);
      expect(mockGenreService.deleteGenre).toHaveBeenCalledTimes(1);
    });

    it('should handle deletion of different genre IDs', async () => {
      const genreId = 'different-genre-id';
      const expectedResult = {
        message: 'Delete genre successfully!',
      };

      mockGenreService.deleteGenre.mockResolvedValue(expectedResult);

      const result = await controller.deleteGenre(genreId);

      expect(result).toEqual(expectedResult);
      expect(mockGenreService.deleteGenre).toHaveBeenCalledWith(genreId);
    });

    it('should handle non-existent genre deletion', async () => {
      const genreId = 'non-existent-id';
      const serviceError = new Error('Genre not found');
      mockGenreService.deleteGenre.mockRejectedValue(serviceError);

      await expect(controller.deleteGenre(genreId)).rejects.toThrow(
        'Genre not found'
      );
      expect(mockGenreService.deleteGenre).toHaveBeenCalledWith(genreId);
    });

    it('should handle foreign key constraint errors', async () => {
      const genreId = 'genre-with-movies';
      const serviceError = new Error(
        'Cannot delete genre that is used by movies'
      );
      mockGenreService.deleteGenre.mockRejectedValue(serviceError);

      await expect(controller.deleteGenre(genreId)).rejects.toThrow(
        'Cannot delete genre that is used by movies'
      );
      expect(mockGenreService.deleteGenre).toHaveBeenCalledWith(genreId);
    });

    it('should handle service errors during deletion', async () => {
      const genreId = 'genre-id-1';
      const serviceError = new Error('Database deletion failed');
      mockGenreService.deleteGenre.mockRejectedValue(serviceError);

      await expect(controller.deleteGenre(genreId)).rejects.toThrow(
        'Database deletion failed'
      );
      expect(mockGenreService.deleteGenre).toHaveBeenCalledWith(genreId);
    });
  });

  describe('Message Pattern Decorators', () => {
    it('should have correct message patterns for each method', () => {
      const createGenrePattern = Reflect.getMetadata(
        'microservices:pattern',
        controller.createGenre
      );
      const getGenresPattern = Reflect.getMetadata(
        'microservices:pattern',
        controller.getGenres
      );
      const findGenreByIdPattern = Reflect.getMetadata(
        'microservices:pattern',
        controller.findGenreById
      );
      const updateGenrePattern = Reflect.getMetadata(
        'microservices:pattern',
        controller.updateGenre
      );
      const deleteGenrePattern = Reflect.getMetadata(
        'microservices:pattern',
        controller.deleteGenre
      );

      // Patterns might be wrapped in arrays by NestJS microservices decorator
      expect(createGenrePattern).toEqual(
        expect.arrayContaining([MovieServiceMessage.GENRE.CREATED])
      );
      expect(getGenresPattern).toEqual(
        expect.arrayContaining([MovieServiceMessage.GENRE.GET_LIST])
      );
      expect(findGenreByIdPattern).toEqual(
        expect.arrayContaining([MovieServiceMessage.GENRE.GET_DETAIL])
      );
      expect(updateGenrePattern).toEqual(
        expect.arrayContaining([MovieServiceMessage.GENRE.UPDATED])
      );
      expect(deleteGenrePattern).toEqual(
        expect.arrayContaining([MovieServiceMessage.GENRE.DELETED])
      );
    });

    it('should verify individual message patterns', () => {
      expect(MovieServiceMessage.GENRE.CREATED).toBe('genre.created');
      expect(MovieServiceMessage.GENRE.GET_LIST).toBe('genre.list');
      expect(MovieServiceMessage.GENRE.GET_DETAIL).toBe('genre.detail');
      expect(MovieServiceMessage.GENRE.UPDATED).toBe('genre.updated');
      expect(MovieServiceMessage.GENRE.DELETED).toBe('genre.deleted');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors in createGenre', async () => {
      const createRequest: GenreRequest = { name: 'Test Genre' };
      const serviceError = new Error('Validation failed');

      mockGenreService.createGenre.mockRejectedValue(serviceError);

      await expect(controller.createGenre(createRequest)).rejects.toThrow(
        'Validation failed'
      );
      expect(mockGenreService.createGenre).toHaveBeenCalledWith(createRequest);
    });

    it('should handle service errors in getGenres', async () => {
      const serviceError = new Error('Database connection failed');

      mockGenreService.getGenres.mockRejectedValue(serviceError);

      await expect(controller.getGenres()).rejects.toThrow(
        'Database connection failed'
      );
      expect(mockGenreService.getGenres).toHaveBeenCalledWith();
    });

    it('should handle service errors in findGenreById', async () => {
      const genreId = 'error-genre-id';
      const serviceError = new Error('Access denied');

      mockGenreService.findGenreById.mockRejectedValue(serviceError);

      await expect(controller.findGenreById(genreId)).rejects.toThrow(
        'Access denied'
      );
      expect(mockGenreService.findGenreById).toHaveBeenCalledWith(genreId);
    });

    it('should handle service errors in updateGenre', async () => {
      const payload = {
        id: 'error-update-id',
        request: { name: 'Error Update' } as GenreRequest,
      };
      const serviceError = new Error('Concurrent update conflict');

      mockGenreService.updateGenre.mockRejectedValue(serviceError);

      await expect(controller.updateGenre(payload)).rejects.toThrow(
        'Concurrent update conflict'
      );
      expect(mockGenreService.updateGenre).toHaveBeenCalledWith(
        payload.id,
        payload.request
      );
    });

    it('should handle service errors in deleteGenre', async () => {
      const genreId = 'error-delete-id';
      const serviceError = new Error('Integrity constraint violation');

      mockGenreService.deleteGenre.mockRejectedValue(serviceError);

      await expect(controller.deleteGenre(genreId)).rejects.toThrow(
        'Integrity constraint violation'
      );
      expect(mockGenreService.deleteGenre).toHaveBeenCalledWith(genreId);
    });
  });

  describe('Payload Validation', () => {
    it('should handle createGenre with valid payload structure', async () => {
      const createRequest: GenreRequest = { name: 'Valid Genre' };
      const expectedResult = {
        data: { id: 'genre-id', name: 'Valid Genre' } as GenreResponse,
        message: 'Create genre successfully!',
      };

      mockGenreService.createGenre.mockResolvedValue(expectedResult);

      const result = await controller.createGenre(createRequest);

      expect(result).toEqual(expectedResult);
      expect(mockGenreService.createGenre).toHaveBeenCalledWith(createRequest);
    });

    it('should handle updateGenre with valid payload structure', async () => {
      const payload = {
        id: 'valid-id',
        request: { name: 'Valid Update' } as GenreRequest,
      };
      const expectedResult = {
        data: { id: payload.id, name: 'Valid Update' } as GenreResponse,
        message: 'Update genre successfully!',
      };

      mockGenreService.updateGenre.mockResolvedValue(expectedResult);

      const result = await controller.updateGenre(payload);

      expect(result).toEqual(expectedResult);
      expect(mockGenreService.updateGenre).toHaveBeenCalledWith(
        payload.id,
        payload.request
      );
    });

    it('should handle single string payload for ID-based operations', async () => {
      const genreId = 'string-id-payload';
      const expectedResult = {
        data: { id: genreId, name: 'Test Genre' } as GenreResponse,
      };

      mockGenreService.findGenreById.mockResolvedValue(expectedResult);

      const result = await controller.findGenreById(genreId);

      expect(result).toEqual(expectedResult);
      expect(mockGenreService.findGenreById).toHaveBeenCalledWith(genreId);
    });
  });
});
