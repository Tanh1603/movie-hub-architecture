import { Test, TestingModule } from '@nestjs/testing';
import { GenreService } from './genre.service';
import { PrismaService } from '../prisma/prisma.service';
import { GenreRequest, GenreResponse } from '@movie-hub/shared-types';

describe('GenreService', () => {
  let service: GenreService;

  const mockPrismaService = {
    genre: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenreService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GenreService>(GenreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGenre', () => {
    it('should create a genre successfully', async () => {
      const createGenreDto: GenreRequest = {
        name: 'Action',
      };

      const mockCreatedGenre: GenreResponse = {
        id: 'genre-id-1',
        name: 'Action',
      };

      mockPrismaService.genre.create.mockResolvedValue(mockCreatedGenre);

      const result = await service.createGenre(createGenreDto);

      expect(result.data).toEqual(mockCreatedGenre);
      expect(result.message).toBe('Create genre successfully!');
      expect(mockPrismaService.genre.create).toHaveBeenCalledWith({
        data: createGenreDto,
      });
      expect(mockPrismaService.genre.create).toHaveBeenCalledTimes(1);
    });

    it('should handle different genre names', async () => {
      const createGenreDto: GenreRequest = {
        name: 'Horror',
      };

      const mockCreatedGenre: GenreResponse = {
        id: 'genre-id-2',
        name: 'Horror',
      };

      mockPrismaService.genre.create.mockResolvedValue(mockCreatedGenre);

      const result = await service.createGenre(createGenreDto);

      expect(result.data).toEqual(mockCreatedGenre);
      expect(result.message).toBe('Create genre successfully!');
      expect(mockPrismaService.genre.create).toHaveBeenCalledWith({
        data: createGenreDto,
      });
    });

    it('should handle create with special characters in name', async () => {
      const createGenreDto: GenreRequest = {
        name: 'Sci-Fi & Fantasy',
      };

      const mockCreatedGenre: GenreResponse = {
        id: 'genre-id-3',
        name: 'Sci-Fi & Fantasy',
      };

      mockPrismaService.genre.create.mockResolvedValue(mockCreatedGenre);

      const result = await service.createGenre(createGenreDto);

      expect(result.data).toEqual(mockCreatedGenre);
      expect(result.message).toBe('Create genre successfully!');
      expect(mockPrismaService.genre.create).toHaveBeenCalledWith({
        data: createGenreDto,
      });
    });

    it('should handle database errors during creation', async () => {
      const createGenreDto: GenreRequest = {
        name: 'Drama',
      };

      const dbError = new Error('Database connection failed');
      mockPrismaService.genre.create.mockRejectedValue(dbError);

      await expect(service.createGenre(createGenreDto)).rejects.toThrow(
        'Database connection failed'
      );
      expect(mockPrismaService.genre.create).toHaveBeenCalledWith({
        data: createGenreDto,
      });
    });
  });

  describe('getGenres', () => {
    it('should return all genres', async () => {
      const mockGenres: GenreResponse[] = [
        { id: 'genre-1', name: 'Action' },
        { id: 'genre-2', name: 'Comedy' },
        { id: 'genre-3', name: 'Drama' },
        { id: 'genre-4', name: 'Horror' },
      ];

      mockPrismaService.genre.findMany.mockResolvedValue(mockGenres);

      const result = await service.getGenres();

      expect(result.data).toEqual(mockGenres);
      expect(result.data).toHaveLength(4);
      expect(result.message).toBeUndefined();
      expect(mockPrismaService.genre.findMany).toHaveBeenCalledWith();
      expect(mockPrismaService.genre.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no genres exist', async () => {
      const mockGenres: GenreResponse[] = [];

      mockPrismaService.genre.findMany.mockResolvedValue(mockGenres);

      const result = await service.getGenres();

      expect(result.data).toEqual([]);
      expect(result.data).toHaveLength(0);
      expect(mockPrismaService.genre.findMany).toHaveBeenCalledWith();
    });

    it('should handle single genre in database', async () => {
      const mockGenres: GenreResponse[] = [
        { id: 'genre-1', name: 'Documentary' },
      ];

      mockPrismaService.genre.findMany.mockResolvedValue(mockGenres);

      const result = await service.getGenres();

      expect(result.data).toEqual(mockGenres);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Documentary');
      expect(mockPrismaService.genre.findMany).toHaveBeenCalledWith();
    });

    it('should handle database errors during retrieval', async () => {
      const dbError = new Error('Database query failed');
      mockPrismaService.genre.findMany.mockRejectedValue(dbError);

      await expect(service.getGenres()).rejects.toThrow(
        'Database query failed'
      );
      expect(mockPrismaService.genre.findMany).toHaveBeenCalledWith();
    });
  });

  describe('findGenreById', () => {
    it('should return a genre by ID', async () => {
      const genreId = 'genre-id-1';
      const mockGenre: GenreResponse = {
        id: genreId,
        name: 'Thriller',
      };

      mockPrismaService.genre.findUnique.mockResolvedValue(mockGenre);

      const result = await service.findGenreById(genreId);

      expect(result.data).toEqual(mockGenre);
      expect(result.message).toBeUndefined();
      expect(mockPrismaService.genre.findUnique).toHaveBeenCalledWith({
        where: { id: genreId },
      });
      expect(mockPrismaService.genre.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return null when genre is not found', async () => {
      const genreId = 'non-existent-id';

      mockPrismaService.genre.findUnique.mockResolvedValue(null);

      const result = await service.findGenreById(genreId);

      expect(result.data).toBeNull();
      expect(mockPrismaService.genre.findUnique).toHaveBeenCalledWith({
        where: { id: genreId },
      });
    });

    it('should handle different genre IDs', async () => {
      const genreId = 'genre-uuid-123';
      const mockGenre: GenreResponse = {
        id: genreId,
        name: 'Romance',
      };

      mockPrismaService.genre.findUnique.mockResolvedValue(mockGenre);

      const result = await service.findGenreById(genreId);

      expect(result.data).toEqual(mockGenre);
      expect(result.data?.id).toBe(genreId);
      expect(result.data?.name).toBe('Romance');
      expect(mockPrismaService.genre.findUnique).toHaveBeenCalledWith({
        where: { id: genreId },
      });
    });

    it('should handle database errors during find', async () => {
      const genreId = 'genre-id-1';
      const dbError = new Error('Database connection lost');
      mockPrismaService.genre.findUnique.mockRejectedValue(dbError);

      await expect(service.findGenreById(genreId)).rejects.toThrow(
        'Database connection lost'
      );
      expect(mockPrismaService.genre.findUnique).toHaveBeenCalledWith({
        where: { id: genreId },
      });
    });
  });

  describe('updateGenre', () => {
    it('should update a genre successfully', async () => {
      const genreId = 'genre-id-1';
      const updateGenreDto: GenreRequest = {
        name: 'Updated Action',
      };

      const mockUpdatedGenre: GenreResponse = {
        id: genreId,
        name: 'Updated Action',
      };

      mockPrismaService.genre.update.mockResolvedValue(mockUpdatedGenre);

      const result = await service.updateGenre(genreId, updateGenreDto);

      expect(result.data).toEqual(mockUpdatedGenre);
      expect(result.message).toBe('Update genre successfully!');
      expect(mockPrismaService.genre.update).toHaveBeenCalledWith({
        data: updateGenreDto,
        where: { id: genreId },
      });
      expect(mockPrismaService.genre.update).toHaveBeenCalledTimes(1);
    });

    it('should update genre name with special characters', async () => {
      const genreId = 'genre-id-2';
      const updateGenreDto: GenreRequest = {
        name: 'Action & Adventure',
      };

      const mockUpdatedGenre: GenreResponse = {
        id: genreId,
        name: 'Action & Adventure',
      };

      mockPrismaService.genre.update.mockResolvedValue(mockUpdatedGenre);

      const result = await service.updateGenre(genreId, updateGenreDto);

      expect(result.data).toEqual(mockUpdatedGenre);
      expect(result.message).toBe('Update genre successfully!');
      expect(mockPrismaService.genre.update).toHaveBeenCalledWith({
        data: updateGenreDto,
        where: { id: genreId },
      });
    });

    it('should handle update with same name', async () => {
      const genreId = 'genre-id-3';
      const updateGenreDto: GenreRequest = {
        name: 'Comedy',
      };

      const mockUpdatedGenre: GenreResponse = {
        id: genreId,
        name: 'Comedy',
      };

      mockPrismaService.genre.update.mockResolvedValue(mockUpdatedGenre);

      const result = await service.updateGenre(genreId, updateGenreDto);

      expect(result.data).toEqual(mockUpdatedGenre);
      expect(result.message).toBe('Update genre successfully!');
      expect(mockPrismaService.genre.update).toHaveBeenCalledWith({
        data: updateGenreDto,
        where: { id: genreId },
      });
    });

    it('should handle non-existent genre update', async () => {
      const genreId = 'non-existent-id';
      const updateGenreDto: GenreRequest = {
        name: 'New Genre',
      };

      const dbError = new Error('Record to update not found');
      mockPrismaService.genre.update.mockRejectedValue(dbError);

      await expect(
        service.updateGenre(genreId, updateGenreDto)
      ).rejects.toThrow('Record to update not found');
      expect(mockPrismaService.genre.update).toHaveBeenCalledWith({
        data: updateGenreDto,
        where: { id: genreId },
      });
    });

    it('should handle database errors during update', async () => {
      const genreId = 'genre-id-1';
      const updateGenreDto: GenreRequest = {
        name: 'Updated Genre',
      };

      const dbError = new Error('Database update failed');
      mockPrismaService.genre.update.mockRejectedValue(dbError);

      await expect(
        service.updateGenre(genreId, updateGenreDto)
      ).rejects.toThrow('Database update failed');
      expect(mockPrismaService.genre.update).toHaveBeenCalledWith({
        data: updateGenreDto,
        where: { id: genreId },
      });
    });
  });

  describe('deleteGenre', () => {
    it('should delete a genre successfully', async () => {
      const genreId = 'genre-id-1';

      mockPrismaService.genre.delete.mockResolvedValue({});

      const result = await service.deleteGenre(genreId);

      expect(result.message).toBe('Delete genre successfully!');
      expect(mockPrismaService.genre.delete).toHaveBeenCalledWith({
        where: { id: genreId },
      });
      expect(mockPrismaService.genre.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle deletion of different genre IDs', async () => {
      const genreId = 'different-genre-id';

      mockPrismaService.genre.delete.mockResolvedValue({});

      const result = await service.deleteGenre(genreId);

      expect(result.message).toBe('Delete genre successfully!');
      expect(mockPrismaService.genre.delete).toHaveBeenCalledWith({
        where: { id: genreId },
      });
    });

    it('should handle non-existent genre deletion', async () => {
      const genreId = 'non-existent-id';

      const dbError = new Error('Record to delete does not exist');
      mockPrismaService.genre.delete.mockRejectedValue(dbError);

      await expect(service.deleteGenre(genreId)).rejects.toThrow(
        'Record to delete does not exist'
      );
      expect(mockPrismaService.genre.delete).toHaveBeenCalledWith({
        where: { id: genreId },
      });
    });

    it('should handle database errors during deletion', async () => {
      const genreId = 'genre-id-1';

      const dbError = new Error('Database deletion failed');
      mockPrismaService.genre.delete.mockRejectedValue(dbError);

      await expect(service.deleteGenre(genreId)).rejects.toThrow(
        'Database deletion failed'
      );
      expect(mockPrismaService.genre.delete).toHaveBeenCalledWith({
        where: { id: genreId },
      });
    });

    it('should handle foreign key constraint errors', async () => {
      const genreId = 'genre-with-movies';

      const dbError = new Error('Foreign key constraint failed');
      mockPrismaService.genre.delete.mockRejectedValue(dbError);

      await expect(service.deleteGenre(genreId)).rejects.toThrow(
        'Foreign key constraint failed'
      );
      expect(mockPrismaService.genre.delete).toHaveBeenCalledWith({
        where: { id: genreId },
      });
    });
  });

  describe('Error Handling', () => {
    it('should propagate unexpected errors from create', async () => {
      const createGenreDto: GenreRequest = { name: 'Test Genre' };
      const unexpectedError = new Error('Unexpected database error');
      mockPrismaService.genre.create.mockRejectedValue(unexpectedError);

      await expect(service.createGenre(createGenreDto)).rejects.toThrow(
        'Unexpected database error'
      );
    });

    it('should propagate unexpected errors from getGenres', async () => {
      const unexpectedError = new Error('Network timeout');
      mockPrismaService.genre.findMany.mockRejectedValue(unexpectedError);

      await expect(service.getGenres()).rejects.toThrow('Network timeout');
    });

    it('should propagate unexpected errors from findGenreById', async () => {
      const genreId = 'test-id';
      const unexpectedError = new Error('Permission denied');
      mockPrismaService.genre.findUnique.mockRejectedValue(unexpectedError);

      await expect(service.findGenreById(genreId)).rejects.toThrow(
        'Permission denied'
      );
    });

    it('should propagate unexpected errors from updateGenre', async () => {
      const genreId = 'test-id';
      const updateDto: GenreRequest = { name: 'Updated' };
      const unexpectedError = new Error('Validation failed');
      mockPrismaService.genre.update.mockRejectedValue(unexpectedError);

      await expect(service.updateGenre(genreId, updateDto)).rejects.toThrow(
        'Validation failed'
      );
    });

    it('should propagate unexpected errors from deleteGenre', async () => {
      const genreId = 'test-id';
      const unexpectedError = new Error('Transaction failed');
      mockPrismaService.genre.delete.mockRejectedValue(unexpectedError);

      await expect(service.deleteGenre(genreId)).rejects.toThrow(
        'Transaction failed'
      );
    });
  });
});
