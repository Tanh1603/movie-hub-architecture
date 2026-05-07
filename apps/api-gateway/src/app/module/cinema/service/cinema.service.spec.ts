import { Test, TestingModule } from '@nestjs/testing';
import { CinemaService } from './cinema.service';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICE_NAME, CinemaMessage } from '@movie-hub/shared-types';
import { of, throwError } from 'rxjs';

describe('CinemaService', () => {
  let service: CinemaService;
  let clientProxy: jest.Mocked<ClientProxy>;

  const mockClientProxy = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CinemaService,
        {
          provide: SERVICE_NAME.CINEMA,
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    service = module.get<CinemaService>(CinemaService);
    clientProxy = module.get(SERVICE_NAME.CINEMA);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCinemas', () => {
    it('should proxy request to get all cinemas', async () => {
      const mockResponse = { data: [{ id: '1', name: 'Cinema 1' }] };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.getCinemas();

      expect(clientProxy.send).toHaveBeenCalledWith(
        CinemaMessage.GET_CINEMAS,
        {}
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle service errors', async () => {
      const mockError = new Error('Service unavailable');

      clientProxy.send.mockReturnValue(throwError(() => mockError));

      await expect(service.getCinemas()).rejects.toThrow(mockError);
    });
  });

  describe('getCinemasNearby', () => {
    it('should proxy request to get nearby cinemas', async () => {
      const nearbyQuery = {
        latitude: 10.8231,
        longitude: 106.6297,
        radiusKm: 10,
        limit: 20,
      };
      const mockResponse = {
        data: [{ id: '1', name: 'Cinema 1', distance: 2.5 }],
      };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.getCinemasNearby(nearbyQuery);

      expect(clientProxy.send).toHaveBeenCalledWith(
        CinemaMessage.GET_CINEMAS_NEARBY,
        nearbyQuery
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle missing optional parameters', async () => {
      const nearbyQuery = {
        latitude: 10.8231,
        longitude: 106.6297,
      };
      const mockResponse = { data: [] };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.getCinemasNearby(nearbyQuery);

      expect(clientProxy.send).toHaveBeenCalledWith(
        CinemaMessage.GET_CINEMAS_NEARBY,
        nearbyQuery
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCinemasWithFilters', () => {
    it('should proxy request with complex filters', async () => {
      const filters = {
        latitude: 10.8231,
        longitude: 106.6297,
        radiusKm: 15,
        city: 'Ho Chi Minh City',
        district: 'District 1',
        amenities: ['IMAX', '4DX'],
        hallTypes: ['Standard', 'Premium'],
        minRating: 4.0,
        page: 1,
        limit: 10,
        sortBy: 'distance' as const,
        sortOrder: 'asc' as const,
      };
      const mockResponse = {
        data: [{ id: '1', name: 'Cinema 1' }],
        meta: { page: 1, limit: 10 },
      };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.getCinemasWithFilters(filters);

      expect(clientProxy.send).toHaveBeenCalledWith(
        CinemaMessage.GET_CINEMAS_WITH_FILTERS,
        filters
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty filters', async () => {
      const filters = {};
      const mockResponse = { data: [] };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.getCinemasWithFilters(filters);

      expect(clientProxy.send).toHaveBeenCalledWith(
        CinemaMessage.GET_CINEMAS_WITH_FILTERS,
        filters
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCinemaDetail', () => {
    it('should proxy request to get cinema detail with user location', async () => {
      const cinemaId = '123';
      const userLatitude = 10.8231;
      const userLongitude = 106.6297;
      const mockResponse = {
        data: {
          id: cinemaId,
          name: 'Cinema 1',
          distance: 5.2,
        },
      };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.getCinemaDetail(
        cinemaId,
        userLatitude,
        userLongitude
      );

      expect(clientProxy.send).toHaveBeenCalledWith(
        CinemaMessage.GET_CINEMA_DETAIL,
        { cinemaId, userLatitude, userLongitude }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should proxy request without user location', async () => {
      const cinemaId = '123';
      const mockResponse = { data: { id: cinemaId, name: 'Cinema 1' } };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.getCinemaDetail(cinemaId);

      expect(clientProxy.send).toHaveBeenCalledWith(
        CinemaMessage.GET_CINEMA_DETAIL,
        { cinemaId, userLatitude: undefined, userLongitude: undefined }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchCinemas', () => {
    it('should proxy search request with user location', async () => {
      const query = 'CGV';
      const userLatitude = 10.8231;
      const userLongitude = 106.6297;
      const mockResponse = {
        data: [{ id: '1', name: 'CGV Cinema', distance: 3.1 }],
      };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.searchCinemas(
        query,
        userLatitude,
        userLongitude
      );

      expect(clientProxy.send).toHaveBeenCalledWith(
        CinemaMessage.SEARCH_CINEMAS,
        { query, userLatitude, userLongitude }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should proxy search request without user location', async () => {
      const query = 'Lotte';
      const mockResponse = { data: [{ id: '2', name: 'Lotte Cinema' }] };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.searchCinemas(query);

      expect(clientProxy.send).toHaveBeenCalledWith(
        CinemaMessage.SEARCH_CINEMAS,
        { query, userLatitude: undefined, userLongitude: undefined }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAvailableCities', () => {
    it('should proxy request to get available cities', async () => {
      const mockResponse = {
        data: ['Ho Chi Minh City', 'Hanoi', 'Da Nang'],
      };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.getAvailableCities();

      expect(clientProxy.send).toHaveBeenCalledWith(
        CinemaMessage.GET_AVAILABLE_CITIES,
        {}
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAvailableDistricts', () => {
    it('should proxy request to get districts by city', async () => {
      const city = 'Ho Chi Minh City';
      const mockResponse = {
        data: ['District 1', 'District 3', 'District 7'],
      };

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.getAvailableDistricts(city);

      expect(clientProxy.send).toHaveBeenCalledWith(
        CinemaMessage.GET_AVAILABLE_DISTRICTS,
        { city }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMovieShowtimesAtCinema', () => {
    it('should proxy request to get showtimes', async () => {
      const cinemaId = '123';
      const movieId = '456';
      const query = { date: '2025-10-25' };
      const mockResponse = [
        {
          id: '789',
          startTime: '14:00',
          hall: { name: 'Hall 1' },
        },
      ];

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.getMovieShowtimesAtCinema(
        cinemaId,
        movieId,
        query
      );

      expect(clientProxy.send).toHaveBeenCalledWith(
        CinemaMessage.CINEMA.GET_SHOWTIME,
        { cinemaId, movieId, query }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle no showtimes found', async () => {
      const cinemaId = '123';
      const movieId = '456';
      const query = { date: '2025-12-25' };
      const mockResponse: never[] = [];

      clientProxy.send.mockReturnValue(of(mockResponse));

      const result = await service.getMovieShowtimesAtCinema(
        cinemaId,
        movieId,
        query
      );

      expect(result).toEqual(mockResponse);
    });
  });
});
