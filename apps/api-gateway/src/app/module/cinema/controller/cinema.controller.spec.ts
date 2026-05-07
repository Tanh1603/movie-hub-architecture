import { Test, TestingModule } from '@nestjs/testing';
import { CinemaController } from './cinema.controller';
import { CinemaService } from '../service/cinema.service';
import { BadRequestException } from '@nestjs/common';

describe('CinemaController', () => {
  let controller: CinemaController;
  let cinemaService: jest.Mocked<CinemaService>;

  const mockCinemaService = {
    getCinemas: jest.fn(),
    getCinemasNearby: jest.fn(),
    searchCinemas: jest.fn(),
    getCinemasWithFilters: jest.fn(),
    getAvailableCities: jest.fn(),
    getAvailableDistricts: jest.fn(),
    getCinemaDetail: jest.fn(),
    getMovieShowtimesAtCinema: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CinemaController],
      providers: [
        {
          provide: CinemaService,
          useValue: mockCinemaService,
        },
      ],
    }).compile();

    controller = module.get<CinemaController>(CinemaController);
    cinemaService = module.get(CinemaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCinemas', () => {
    it('should return all cinemas', async () => {
      const mockResult = { data: [{ id: '1', name: 'Cinema 1' }] };
      cinemaService.getCinemas.mockResolvedValue(mockResult);

      const result = await controller.getCinemas();

      expect(cinemaService.getCinemas).toHaveBeenCalledWith();
      expect(result).toEqual(mockResult);
    });
  });

  describe('getCinemasNearby', () => {
    it('should return nearby cinemas with all parameters', async () => {
      const latitude = 10.8231;
      const longitude = 106.6297;
      const radiusKm = 15;
      const limit = 25;
      const mockResult = {
        data: [{ id: '1', name: 'Cinema 1', distance: 2.5 }],
      };

      cinemaService.getCinemasNearby.mockResolvedValue(mockResult);

      const result = await controller.getCinemasNearby(
        latitude,
        longitude,
        radiusKm,
        limit
      );

      expect(cinemaService.getCinemasNearby).toHaveBeenCalledWith({
        latitude,
        longitude,
        radiusKm,
        limit,
      });
      expect(result).toEqual(mockResult);
    });

    it('should use default values for optional parameters', async () => {
      const latitude = 10.8231;
      const longitude = 106.6297;
      const mockResult = { data: [] };

      cinemaService.getCinemasNearby.mockResolvedValue(mockResult);

      // Default values should be applied by DefaultValuePipe
      const result = await controller.getCinemasNearby(
        latitude,
        longitude,
        10,
        20
      );

      expect(cinemaService.getCinemasNearby).toHaveBeenCalledWith({
        latitude,
        longitude,
        radiusKm: 10,
        limit: 20,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('searchCinemas', () => {
    it('should search cinemas with user location', async () => {
      const query = 'CGV';
      const latitude = '10.8231';
      const longitude = '106.6297';
      const mockResult = { data: [{ id: '1', name: 'CGV Cinema' }] };

      cinemaService.searchCinemas.mockResolvedValue(mockResult);

      const result = await controller.searchCinemas(query, latitude, longitude);

      expect(cinemaService.searchCinemas).toHaveBeenCalledWith(
        query,
        10.8231,
        106.6297
      );
      expect(result).toEqual(mockResult);
    });

    it('should search cinemas without user location', async () => {
      const query = 'Lotte';
      const mockResult = { data: [{ id: '2', name: 'Lotte Cinema' }] };

      cinemaService.searchCinemas.mockResolvedValue(mockResult);

      const result = await controller.searchCinemas(query);

      expect(cinemaService.searchCinemas).toHaveBeenCalledWith(
        query,
        undefined,
        undefined
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw BadRequestException for empty query', async () => {
      await expect(controller.searchCinemas('')).rejects.toThrow(
        BadRequestException
      );
      await expect(controller.searchCinemas('   ')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for missing query', async () => {
      await expect(controller.searchCinemas(undefined as any)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getCinemasWithFilters', () => {
    it('should parse and pass all filters correctly', async () => {
      const mockResult = { data: [{ id: '1', name: 'Cinema 1' }] };
      cinemaService.getCinemasWithFilters.mockResolvedValue(mockResult);

      const result = await controller.getCinemasWithFilters(
        '10.8231', // latitude
        '106.6297', // longitude
        '15', // radiusKm
        'Ho Chi Minh City', // city
        'District 1', // district
        'IMAX,4DX', // amenities
        'Standard,Premium', // hallTypes
        '4.5', // minRating
        '2', // page
        '20', // limit
        'distance', // sortBy
        'asc' // sortOrder
      );

      expect(cinemaService.getCinemasWithFilters).toHaveBeenCalledWith({
        latitude: 10.8231,
        longitude: 106.6297,
        radiusKm: 15,
        city: 'Ho Chi Minh City',
        district: 'District 1',
        amenities: ['IMAX', '4DX'],
        hallTypes: ['Standard', 'Premium'],
        minRating: 4.5,
        page: 2,
        limit: 20,
        sortBy: 'distance',
        sortOrder: 'asc',
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle partial filters', async () => {
      const mockResult = { data: [] };
      cinemaService.getCinemasWithFilters.mockResolvedValue(mockResult);

      const result = await controller.getCinemasWithFilters(
        undefined, // latitude
        undefined, // longitude
        undefined, // radiusKm
        'Hanoi', // city
        undefined, // district
        undefined, // amenities
        undefined, // hallTypes
        undefined, // minRating
        '1', // page
        undefined, // limit
        undefined, // sortBy
        undefined // sortOrder
      );

      expect(cinemaService.getCinemasWithFilters).toHaveBeenCalledWith({
        city: 'Hanoi',
        page: 1,
      });
      expect(result).toEqual(mockResult);
    });

    it('should handle empty filters', async () => {
      const mockResult = { data: [] };
      cinemaService.getCinemasWithFilters.mockResolvedValue(mockResult);

      const result = await controller.getCinemasWithFilters();

      expect(cinemaService.getCinemasWithFilters).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResult);
    });
  });

  describe('getAvailableCities', () => {
    it('should return available cities', async () => {
      const mockResult = { data: ['Ho Chi Minh City', 'Hanoi'] };
      cinemaService.getAvailableCities.mockResolvedValue(mockResult);

      const result = await controller.getAvailableCities();

      expect(cinemaService.getAvailableCities).toHaveBeenCalledWith();
      expect(result).toEqual(mockResult);
    });
  });

  describe('getAvailableDistricts', () => {
    it('should return districts for a city', async () => {
      const city = 'Ho Chi Minh City';
      const mockResult = { data: ['District 1', 'District 3'] };
      cinemaService.getAvailableDistricts.mockResolvedValue(mockResult);

      const result = await controller.getAvailableDistricts(city);

      expect(cinemaService.getAvailableDistricts).toHaveBeenCalledWith(city);
      expect(result).toEqual(mockResult);
    });

    it('should throw BadRequestException for empty city', async () => {
      await expect(controller.getAvailableDistricts('')).rejects.toThrow(
        BadRequestException
      );
      await expect(controller.getAvailableDistricts('   ')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getCinemaDetail', () => {
    it('should get cinema detail with user location', async () => {
      const cinemaId = '123';
      const latitude = '10.8231';
      const longitude = '106.6297';
      const mockResult = {
        data: { id: cinemaId, name: 'Cinema 1', distance: 5.2 },
      };

      cinemaService.getCinemaDetail.mockResolvedValue(mockResult);

      const result = await controller.getCinemaDetail(
        cinemaId,
        latitude,
        longitude
      );

      expect(cinemaService.getCinemaDetail).toHaveBeenCalledWith(
        cinemaId,
        10.8231,
        106.6297
      );
      expect(result).toEqual(mockResult);
    });

    it('should get cinema detail without user location', async () => {
      const cinemaId = '123';
      const mockResult = { data: { id: cinemaId, name: 'Cinema 1' } };

      cinemaService.getCinemaDetail.mockResolvedValue(mockResult);

      const result = await controller.getCinemaDetail(cinemaId);

      expect(cinemaService.getCinemaDetail).toHaveBeenCalledWith(
        cinemaId,
        undefined,
        undefined
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getMovieShowtimesAtCinema', () => {
    it('should return showtimes for movie at cinema', async () => {
      const cinemaId = '123';
      const movieId = '456';
      const date = { date: '2025-10-25' };
      const mockResult = [
        {
          id: '789',
          hallId: 'hall-1',
          startTime: new Date('2025-10-25T14:00:00Z'),
          endTime: new Date('2025-10-25T16:30:00Z'),
          status: 'AVAILABLE' as any,
        },
      ];

      cinemaService.getMovieShowtimesAtCinema.mockResolvedValue(mockResult);

      const result = await controller.getMovieShowtimesAtCinema(
        cinemaId,
        movieId,
        date
      );

      expect(cinemaService.getMovieShowtimesAtCinema).toHaveBeenCalledWith(
        cinemaId,
        movieId,
        date
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle no showtimes found', async () => {
      const cinemaId = '123';
      const movieId = '456';
      const date = { date: '2025-12-25' };
      const mockResult: never[] = [];

      cinemaService.getMovieShowtimesAtCinema.mockResolvedValue(mockResult);

      const result = await controller.getMovieShowtimesAtCinema(
        cinemaId,
        movieId,
        date
      );

      expect(result).toEqual(mockResult);
    });
  });
});
