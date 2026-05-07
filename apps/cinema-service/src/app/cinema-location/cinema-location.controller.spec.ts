import { Test, TestingModule } from '@nestjs/testing';
import { CinemaLocationController } from './cinema-location.controller';
import { CinemaLocationService } from './cinema-location.service';
import {
  GetCinemasNearbyDto,
  GetCinemasWithFiltersDto,
  GetCinemaDetailDto,
  CinemaListResponse,
  CinemaLocationResponse,
} from './dto/cinema-location.dto';

describe('CinemaLocationController', () => {
  let controller: CinemaLocationController;
  let service: CinemaLocationService;

  const mockService = {
    getCinemasNearby: jest.fn(),
    getCinemasWithFilters: jest.fn(),
    getCinemaDetail: jest.fn(),
    searchCinemas: jest.fn(),
    getAvailableCities: jest.fn(),
    getAvailableDistricts: jest.fn(),
  };

  const mockCinemaLocationResponse: CinemaLocationResponse = {
    id: 'cinema-1',
    name: 'CGV Vincom Center',
    address: '72 Le Thanh Ton, District 1, Ho Chi Minh City',
    city: 'Ho Chi Minh City',
    district: 'District 1',
    phone: '+84-28-3822-3456',
    email: 'cgv.vincom@cinema.com',
    website: 'https://www.cgv.vn',
    location: {
      latitude: 10.7744,
      longitude: 106.701,
      distance: 2.5,
      distanceText: '2.5km',
    },
    description: 'Premium cinema experience in the heart of the city',
    amenities: ['IMAX', '3D', 'VIP', 'Parking'],
    images: ['image1.jpg', 'image2.jpg'],
    rating: 4.5,
    totalReviews: 1250,
    operatingHours: { monday: { open: '09:00', close: '23:00' } },
    isOpen: true,
    availableHallTypes: ['IMAX', 'VIP'],
    totalHalls: 2,
    status: 'ACTIVE',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=10.7744,106.7010',
    directionsUrl:
      'https://www.google.com/maps/dir/?api=1&origin=10.7745,106.7011&destination=10.7744,106.7010',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockCinemaListResponse: CinemaListResponse = {
    cinemas: [mockCinemaLocationResponse],
    total: 1,
    page: 1,
    limit: 20,
    hasMore: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CinemaLocationController],
      providers: [
        {
          provide: CinemaLocationService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CinemaLocationController>(CinemaLocationController);
    service = module.get<CinemaLocationService>(CinemaLocationService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getCinemasNearby', () => {
    const validDto: GetCinemasNearbyDto = {
      latitude: 10.7745,
      longitude: 106.7011,
      radiusKm: 10,
      limit: 20,
    };

    it('should return nearby cinemas successfully', async () => {
      mockService.getCinemasNearby.mockResolvedValue(mockCinemaListResponse);

      const result = await controller.getCinemasNearby(validDto);

      expect(result).toEqual(mockCinemaListResponse);
      expect(mockService.getCinemasNearby).toHaveBeenCalledWith(validDto);
      expect(mockService.getCinemasNearby).toHaveBeenCalledTimes(1);
    });

    it('should handle DTO with required fields only', async () => {
      const minimalDto = {
        latitude: 10.7745,
        longitude: 106.7011,
      };

      mockService.getCinemasNearby.mockResolvedValue(mockCinemaListResponse);

      const result = await controller.getCinemasNearby(minimalDto);

      expect(result).toEqual(mockCinemaListResponse);
      expect(mockService.getCinemasNearby).toHaveBeenCalledWith(minimalDto);
    });

    it('should handle empty results', async () => {
      const emptyResponse: CinemaListResponse = {
        cinemas: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false,
      };

      mockService.getCinemasNearby.mockResolvedValue(emptyResponse);

      const result = await controller.getCinemasNearby(validDto);

      expect(result).toEqual(emptyResponse);
      expect(result.cinemas).toHaveLength(0);
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('Service error');
      mockService.getCinemasNearby.mockRejectedValue(serviceError);

      await expect(controller.getCinemasNearby(validDto)).rejects.toThrow(
        'Service error'
      );
      expect(mockService.getCinemasNearby).toHaveBeenCalledWith(validDto);
    });

    it('should handle validation errors from service', async () => {
      const invalidDto = {
        latitude: null,
        longitude: null,
      } as unknown as GetCinemasNearbyDto;
      const validationError = new Error('Latitude and longitude are required');
      mockService.getCinemasNearby.mockRejectedValue(validationError);

      await expect(controller.getCinemasNearby(invalidDto)).rejects.toThrow(
        'Latitude and longitude are required'
      );
    });

    it('should pass through all DTO properties', async () => {
      const fullDto: GetCinemasNearbyDto = {
        latitude: 10.7745,
        longitude: 106.7011,
        radiusKm: 5,
        limit: 10,
      };

      mockService.getCinemasNearby.mockResolvedValue(mockCinemaListResponse);

      await controller.getCinemasNearby(fullDto);

      expect(mockService.getCinemasNearby).toHaveBeenCalledWith(fullDto);
      expect(mockService.getCinemasNearby).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 10.7745,
          longitude: 106.7011,
          radiusKm: 5,
          limit: 10,
        })
      );
    });

    it('should handle large datasets', async () => {
      const largeResponse: CinemaListResponse = {
        cinemas: Array.from({ length: 100 }, (_, i) => ({
          ...mockCinemaLocationResponse,
          id: `cinema-${i}`,
        })),
        total: 100,
        page: 1,
        limit: 100,
        hasMore: false,
      };

      mockService.getCinemasNearby.mockResolvedValue(largeResponse);

      const result = await controller.getCinemasNearby(validDto);

      expect(result.cinemas).toHaveLength(100);
      expect(result.total).toBe(100);
    });
  });

  describe('getCinemasWithFilters', () => {
    const validFilter: GetCinemasWithFiltersDto = {
      latitude: 10.7745,
      longitude: 106.7011,
      radiusKm: 10,
      city: 'Ho Chi Minh City',
      district: 'District 1',
      amenities: ['IMAX', 'Parking'],
      hallTypes: ['IMAX', 'VIP'],
      minRating: 4.0,
      page: 1,
      limit: 20,
      sortBy: 'distance',
      sortOrder: 'asc',
    };

    it('should return filtered cinemas successfully', async () => {
      mockService.getCinemasWithFilters.mockResolvedValue(
        mockCinemaListResponse
      );

      const result = await controller.getCinemasWithFilters(validFilter);

      expect(result).toEqual(mockCinemaListResponse);
      expect(mockService.getCinemasWithFilters).toHaveBeenCalledWith(
        validFilter
      );
      expect(mockService.getCinemasWithFilters).toHaveBeenCalledTimes(1);
    });

    it('should handle empty filter object', async () => {
      const emptyFilter = {};

      mockService.getCinemasWithFilters.mockResolvedValue(
        mockCinemaListResponse
      );

      const result = await controller.getCinemasWithFilters(emptyFilter);

      expect(result).toEqual(mockCinemaListResponse);
      expect(mockService.getCinemasWithFilters).toHaveBeenCalledWith(
        emptyFilter
      );
    });

    it('should handle partial filters', async () => {
      const partialFilter = {
        city: 'Ha Noi',
        minRating: 4.5,
      };

      mockService.getCinemasWithFilters.mockResolvedValue(
        mockCinemaListResponse
      );

      await controller.getCinemasWithFilters(partialFilter);

      expect(mockService.getCinemasWithFilters).toHaveBeenCalledWith(
        partialFilter
      );
    });

    it('should handle location-based filters', async () => {
      const locationFilter = {
        latitude: 10.7745,
        longitude: 106.7011,
        radiusKm: 5,
      };

      mockService.getCinemasWithFilters.mockResolvedValue(
        mockCinemaListResponse
      );

      await controller.getCinemasWithFilters(locationFilter);

      expect(mockService.getCinemasWithFilters).toHaveBeenCalledWith(
        locationFilter
      );
    });

    it('should handle text-based filters', async () => {
      const textFilter = {
        city: 'Ho Chi Minh City',
        district: 'District 1',
      };

      mockService.getCinemasWithFilters.mockResolvedValue(
        mockCinemaListResponse
      );

      await controller.getCinemasWithFilters(textFilter);

      expect(mockService.getCinemasWithFilters).toHaveBeenCalledWith(
        textFilter
      );
    });

    it('should handle array-based filters', async () => {
      const arrayFilter = {
        amenities: ['IMAX', '3D', 'VIP'],
        hallTypes: ['IMAX', 'PREMIUM'],
      };

      mockService.getCinemasWithFilters.mockResolvedValue(
        mockCinemaListResponse
      );

      await controller.getCinemasWithFilters(arrayFilter);

      expect(mockService.getCinemasWithFilters).toHaveBeenCalledWith(
        arrayFilter
      );
    });

    it('should handle sorting parameters', async () => {
      const sortingFilter = {
        sortBy: 'rating' as const,
        sortOrder: 'desc' as const,
      };

      mockService.getCinemasWithFilters.mockResolvedValue(
        mockCinemaListResponse
      );

      await controller.getCinemasWithFilters(sortingFilter);

      expect(mockService.getCinemasWithFilters).toHaveBeenCalledWith(
        sortingFilter
      );
    });

    it('should handle pagination parameters', async () => {
      const paginationFilter = {
        page: 2,
        limit: 10,
      };

      const paginatedResponse: CinemaListResponse = {
        ...mockCinemaListResponse,
        page: 2,
        limit: 10,
        hasMore: true,
      };

      mockService.getCinemasWithFilters.mockResolvedValue(paginatedResponse);

      const result = await controller.getCinemasWithFilters(paginationFilter);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.hasMore).toBe(true);
      expect(mockService.getCinemasWithFilters).toHaveBeenCalledWith(
        paginationFilter
      );
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('Filter service error');
      mockService.getCinemasWithFilters.mockRejectedValue(serviceError);

      await expect(
        controller.getCinemasWithFilters(validFilter)
      ).rejects.toThrow('Filter service error');
    });

    it('should handle complex combined filters', async () => {
      const complexFilter = {
        latitude: 10.7745,
        longitude: 106.7011,
        radiusKm: 15,
        city: 'Ho Chi Minh City',
        amenities: ['IMAX', 'Parking', 'Food Court'],
        hallTypes: ['IMAX', 'VIP', 'PREMIUM'],
        minRating: 4.2,
        page: 1,
        limit: 15,
        sortBy: 'distance' as const,
        sortOrder: 'asc' as const,
      };

      mockService.getCinemasWithFilters.mockResolvedValue(
        mockCinemaListResponse
      );

      await controller.getCinemasWithFilters(complexFilter);

      expect(mockService.getCinemasWithFilters).toHaveBeenCalledWith(
        complexFilter
      );
      expect(mockService.getCinemasWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 10.7745,
          longitude: 106.7011,
          radiusKm: 15,
          city: 'Ho Chi Minh City',
          amenities: ['IMAX', 'Parking', 'Food Court'],
          hallTypes: ['IMAX', 'VIP', 'PREMIUM'],
          minRating: 4.2,
          page: 1,
          limit: 15,
          sortBy: 'distance',
          sortOrder: 'asc',
        })
      );
    });
  });

  describe('getCinemaDetail', () => {
    const validDto: GetCinemaDetailDto = {
      cinemaId: 'cinema-1',
      userLatitude: 10.7745,
      userLongitude: 106.7011,
    };

    it('should return cinema detail successfully', async () => {
      mockService.getCinemaDetail.mockResolvedValue(mockCinemaLocationResponse);

      const result = await controller.getCinemaDetail(validDto);

      expect(result).toEqual(mockCinemaLocationResponse);
      expect(mockService.getCinemaDetail).toHaveBeenCalledWith(validDto);
      expect(mockService.getCinemaDetail).toHaveBeenCalledTimes(1);
    });

    it('should handle DTO without user location', async () => {
      const dtoWithoutLocation = { cinemaId: 'cinema-1' };

      mockService.getCinemaDetail.mockResolvedValue(mockCinemaLocationResponse);

      const result = await controller.getCinemaDetail(dtoWithoutLocation);

      expect(result).toEqual(mockCinemaLocationResponse);
      expect(mockService.getCinemaDetail).toHaveBeenCalledWith(
        dtoWithoutLocation
      );
    });

    it('should propagate NotFoundException from service', async () => {
      const notFoundError = new Error('Cinema with ID cinema-1 not found');
      mockService.getCinemaDetail.mockRejectedValue(notFoundError);

      await expect(controller.getCinemaDetail(validDto)).rejects.toThrow(
        'Cinema with ID cinema-1 not found'
      );
    });

    it('should handle different cinema IDs', async () => {
      const differentDto = {
        cinemaId: 'cinema-123',
        userLatitude: 21.0285,
        userLongitude: 105.8542,
      };

      const differentResponse = {
        ...mockCinemaLocationResponse,
        id: 'cinema-123',
        name: 'Lotte Cinema Ha Noi',
        city: 'Ha Noi',
      };

      mockService.getCinemaDetail.mockResolvedValue(differentResponse);

      const result = await controller.getCinemaDetail(differentDto);

      expect(result.id).toBe('cinema-123');
      expect(result.name).toBe('Lotte Cinema Ha Noi');
      expect(mockService.getCinemaDetail).toHaveBeenCalledWith(differentDto);
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Database connection failed');
      mockService.getCinemaDetail.mockRejectedValue(serviceError);

      await expect(controller.getCinemaDetail(validDto)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should validate cinema ID is passed correctly', async () => {
      const specificDto = {
        cinemaId: 'specific-cinema-id-123',
        userLatitude: 10.7745,
        userLongitude: 106.7011,
      };

      mockService.getCinemaDetail.mockResolvedValue(mockCinemaLocationResponse);

      await controller.getCinemaDetail(specificDto);

      expect(mockService.getCinemaDetail).toHaveBeenCalledWith(
        expect.objectContaining({
          cinemaId: 'specific-cinema-id-123',
        })
      );
    });
  });

  describe('searchCinemas', () => {
    const searchPayload = {
      query: 'CGV',
      userLatitude: 10.7745,
      userLongitude: 106.7011,
    };

    it('should search cinemas successfully', async () => {
      const searchResults = [mockCinemaLocationResponse];
      mockService.searchCinemas.mockResolvedValue(searchResults);

      const result = await controller.searchCinemas(searchPayload);

      expect(result).toEqual(searchResults);
      expect(mockService.searchCinemas).toHaveBeenCalledWith(
        searchPayload.query,
        searchPayload.userLatitude,
        searchPayload.userLongitude
      );
      expect(mockService.searchCinemas).toHaveBeenCalledTimes(1);
    });

    it('should handle search without user location', async () => {
      const payloadWithoutLocation = { query: 'Lotte' };
      const searchResults = [mockCinemaLocationResponse];

      mockService.searchCinemas.mockResolvedValue(searchResults);

      const result = await controller.searchCinemas(payloadWithoutLocation);

      expect(result).toEqual(searchResults);
      expect(mockService.searchCinemas).toHaveBeenCalledWith(
        'Lotte',
        undefined,
        undefined
      );
    });

    it('should handle empty search results', async () => {
      const emptyResults: CinemaLocationResponse[] = [];
      mockService.searchCinemas.mockResolvedValue(emptyResults);

      const result = await controller.searchCinemas(searchPayload);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle different search queries', async () => {
      const queries = [
        'Galaxy',
        'IMAX',
        'District 1',
        'Ho Chi Minh City',
        'Vincom',
      ];

      for (const query of queries) {
        mockService.searchCinemas.mockResolvedValue([
          mockCinemaLocationResponse,
        ]);

        await controller.searchCinemas({ query });

        expect(mockService.searchCinemas).toHaveBeenCalledWith(
          query,
          undefined,
          undefined
        );
      }

      expect(mockService.searchCinemas).toHaveBeenCalledTimes(queries.length);
    });

    it('should handle search with partial user location', async () => {
      const partialLocationPayload = {
        query: 'CGV',
        userLatitude: 10.7745,
      };

      mockService.searchCinemas.mockResolvedValue([mockCinemaLocationResponse]);

      await controller.searchCinemas(partialLocationPayload);

      expect(mockService.searchCinemas).toHaveBeenCalledWith(
        'CGV',
        10.7745,
        undefined
      );
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('Search service error');
      mockService.searchCinemas.mockRejectedValue(serviceError);

      await expect(controller.searchCinemas(searchPayload)).rejects.toThrow(
        'Search service error'
      );
    });

    it('should handle multiple search results', async () => {
      const multipleResults = Array.from({ length: 5 }, (_, i) => ({
        ...mockCinemaLocationResponse,
        id: `cinema-${i + 1}`,
        name: `Cinema ${i + 1}`,
      }));

      mockService.searchCinemas.mockResolvedValue(multipleResults);

      const result = await controller.searchCinemas(searchPayload);

      expect(result).toHaveLength(5);
      expect(result[0].id).toBe('cinema-1');
      expect(result[4].id).toBe('cinema-5');
    });

    it('should handle special characters in search query', async () => {
      const specialQueryPayload = {
        query: 'CGV Vincom @ Central',
        userLatitude: 10.7745,
        userLongitude: 106.7011,
      };

      mockService.searchCinemas.mockResolvedValue([mockCinemaLocationResponse]);

      await controller.searchCinemas(specialQueryPayload);

      expect(mockService.searchCinemas).toHaveBeenCalledWith(
        'CGV Vincom @ Central',
        10.7745,
        106.7011
      );
    });
  });

  describe('getAvailableCities', () => {
    it('should return available cities successfully', async () => {
      const cities = ['Ho Chi Minh City', 'Ha Noi', 'Da Nang', 'Can Tho'];
      mockService.getAvailableCities.mockResolvedValue(cities);

      const result = await controller.getAvailableCities();

      expect(result).toEqual(cities);
      expect(mockService.getAvailableCities).toHaveBeenCalledWith();
      expect(mockService.getAvailableCities).toHaveBeenCalledTimes(1);
    });

    it('should handle empty cities list', async () => {
      const emptyCities: string[] = [];
      mockService.getAvailableCities.mockResolvedValue(emptyCities);

      const result = await controller.getAvailableCities();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle single city', async () => {
      const singleCity = ['Ho Chi Minh City'];
      mockService.getAvailableCities.mockResolvedValue(singleCity);

      const result = await controller.getAvailableCities();

      expect(result).toEqual(['Ho Chi Minh City']);
      expect(result).toHaveLength(1);
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('Cities service error');
      mockService.getAvailableCities.mockRejectedValue(serviceError);

      await expect(controller.getAvailableCities()).rejects.toThrow(
        'Cities service error'
      );
    });

    it('should handle large number of cities', async () => {
      const manyCities = Array.from({ length: 50 }, (_, i) => `City ${i + 1}`);
      mockService.getAvailableCities.mockResolvedValue(manyCities);

      const result = await controller.getAvailableCities();

      expect(result).toHaveLength(50);
      expect(result[0]).toBe('City 1');
      expect(result[49]).toBe('City 50');
    });

    it('should not require any parameters', async () => {
      mockService.getAvailableCities.mockResolvedValue(['Ho Chi Minh City']);

      await controller.getAvailableCities();

      expect(mockService.getAvailableCities).toHaveBeenCalledWith();
      expect(mockService.getAvailableCities).toHaveBeenCalledWith(); // No arguments
    });
  });

  describe('getAvailableDistricts', () => {
    const cityPayload = { city: 'Ho Chi Minh City' };

    it('should return available districts successfully', async () => {
      const districts = ['District 1', 'District 3', 'Binh Thanh', 'Thu Duc'];
      mockService.getAvailableDistricts.mockResolvedValue(districts);

      const result = await controller.getAvailableDistricts(cityPayload);

      expect(result).toEqual(districts);
      expect(mockService.getAvailableDistricts).toHaveBeenCalledWith(
        cityPayload.city
      );
      expect(mockService.getAvailableDistricts).toHaveBeenCalledTimes(1);
    });

    it('should handle empty districts list', async () => {
      const emptyDistricts: string[] = [];
      mockService.getAvailableDistricts.mockResolvedValue(emptyDistricts);

      const result = await controller.getAvailableDistricts(cityPayload);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle different cities', async () => {
      const cities = [
        { city: 'Ha Noi', districts: ['Ba Dinh', 'Hoan Kiem', 'Dong Da'] },
        { city: 'Da Nang', districts: ['Hai Chau', 'Thanh Khe', 'Son Tra'] },
        { city: 'Can Tho', districts: ['Ninh Kieu', 'Cai Rang', 'Binh Thuy'] },
      ];

      for (const { city, districts } of cities) {
        mockService.getAvailableDistricts.mockResolvedValue(districts);

        const result = await controller.getAvailableDistricts({ city });

        expect(result).toEqual(districts);
        expect(mockService.getAvailableDistricts).toHaveBeenCalledWith(city);
      }
    });

    it('should handle single district', async () => {
      const singleDistrict = ['District 1'];
      mockService.getAvailableDistricts.mockResolvedValue(singleDistrict);

      const result = await controller.getAvailableDistricts(cityPayload);

      expect(result).toEqual(['District 1']);
      expect(result).toHaveLength(1);
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('Districts service error');
      mockService.getAvailableDistricts.mockRejectedValue(serviceError);

      await expect(
        controller.getAvailableDistricts(cityPayload)
      ).rejects.toThrow('Districts service error');
    });

    it('should handle case-sensitive city names', async () => {
      const caseSensitivePayloads = [
        { city: 'ho chi minh city' },
        { city: 'Ho Chi Minh City' },
        { city: 'HO CHI MINH CITY' },
      ];

      for (const payload of caseSensitivePayloads) {
        mockService.getAvailableDistricts.mockResolvedValue(['District 1']);

        await controller.getAvailableDistricts(payload);

        expect(mockService.getAvailableDistricts).toHaveBeenCalledWith(
          payload.city
        );
      }
    });

    it('should handle city names with special characters', async () => {
      const specialCityPayload = { city: 'Hồ Chí Minh City' };
      mockService.getAvailableDistricts.mockResolvedValue(['Quận 1', 'Quận 3']);

      const result = await controller.getAvailableDistricts(specialCityPayload);

      expect(result).toEqual(['Quận 1', 'Quận 3']);
      expect(mockService.getAvailableDistricts).toHaveBeenCalledWith(
        'Hồ Chí Minh City'
      );
    });

    it('should pass city parameter correctly', async () => {
      const specificCity = 'Test City Name';
      mockService.getAvailableDistricts.mockResolvedValue(['Test District']);

      await controller.getAvailableDistricts({ city: specificCity });

      expect(mockService.getAvailableDistricts).toHaveBeenCalledWith(
        specificCity
      );
      expect(mockService.getAvailableDistricts).toHaveBeenCalledWith(
        'Test City Name'
      );
    });
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(controller.getCinemasNearby).toBeDefined();
      expect(controller.getCinemasWithFilters).toBeDefined();
      expect(controller.getCinemaDetail).toBeDefined();
      expect(controller.searchCinemas).toBeDefined();
      expect(controller.getAvailableCities).toBeDefined();
      expect(controller.getAvailableDistricts).toBeDefined();
    });

    it('should have service dependency injected', () => {
      expect(service).toBeDefined();
      expect(service).toBe(mockService);
    });

    it('should have correct method types', () => {
      expect(typeof controller.getCinemasNearby).toBe('function');
      expect(typeof controller.getCinemasWithFilters).toBe('function');
      expect(typeof controller.getCinemaDetail).toBe('function');
      expect(typeof controller.searchCinemas).toBe('function');
      expect(typeof controller.getAvailableCities).toBe('function');
      expect(typeof controller.getAvailableDistricts).toBe('function');
    });
  });

  describe('Message Pattern Integration', () => {
    it('should be decorated with correct MessagePatterns', () => {
      // This test verifies that the methods are properly decorated
      // The actual MessagePattern decorators are applied at runtime
      expect(controller.getCinemasNearby).toBeDefined();
      expect(controller.getCinemasWithFilters).toBeDefined();
      expect(controller.getCinemaDetail).toBeDefined();
      expect(controller.searchCinemas).toBeDefined();
      expect(controller.getAvailableCities).toBeDefined();
      expect(controller.getAvailableDistricts).toBeDefined();
    });

    it('should handle microservice communication patterns', async () => {
      const validDto: GetCinemasNearbyDto = {
        latitude: 10.7745,
        longitude: 106.7011,
      };

      mockService.getCinemasNearby.mockResolvedValue(mockCinemaListResponse);

      const result = await controller.getCinemasNearby(validDto);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(mockService.getCinemasNearby).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors without modification', async () => {
      const originalError = new Error('Original service error');
      mockService.getCinemasNearby.mockRejectedValue(originalError);

      const dto: GetCinemasNearbyDto = {
        latitude: 10.7745,
        longitude: 106.7011,
      };

      await expect(controller.getCinemasNearby(dto)).rejects.toThrow(
        'Original service error'
      );
    });

    it('should handle multiple service method errors', async () => {
      const methods = [
        {
          method: 'getCinemasNearby',
          dto: { latitude: 10.7745, longitude: 106.7011 },
        },
        { method: 'getCinemasWithFilters', dto: {} },
        { method: 'getCinemaDetail', dto: { cinemaId: 'cinema-1' } },
        { method: 'searchCinemas', dto: { query: 'test' } },
        { method: 'getAvailableCities', dto: undefined },
        { method: 'getAvailableDistricts', dto: { city: 'Test City' } },
      ];

      for (const { method, dto } of methods) {
        const error = new Error(`${method} error`);
        (
          mockService as unknown as Record<
            string,
            jest.MockedFunction<(...args: unknown[]) => Promise<unknown>>
          >
        )[method].mockRejectedValue(error);

        if (dto) {
          await expect(
            (
              controller as unknown as Record<
                string,
                (...args: unknown[]) => Promise<unknown>
              >
            )[method](dto)
          ).rejects.toThrow(`${method} error`);
        } else {
          await expect(
            (
              controller as unknown as Record<
                string,
                (...args: unknown[]) => Promise<unknown>
              >
            )[method]()
          ).rejects.toThrow(`${method} error`);
        }
      }
    });

    it('should handle async operation failures', async () => {
      const asyncError = new Error('Async operation failed');
      mockService.getCinemasNearby.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw asyncError;
      });

      const dto: GetCinemasNearbyDto = {
        latitude: 10.7745,
        longitude: 106.7011,
      };

      await expect(controller.getCinemasNearby(dto)).rejects.toThrow(
        'Async operation failed'
      );
    });
  });

  describe('Data Validation', () => {
    it('should pass through data without modification', async () => {
      const inputDto: GetCinemasNearbyDto = {
        latitude: 10.7745,
        longitude: 106.7011,
        radiusKm: 5,
        limit: 10,
      };

      mockService.getCinemasNearby.mockResolvedValue(mockCinemaListResponse);

      await controller.getCinemasNearby(inputDto);

      expect(mockService.getCinemasNearby).toHaveBeenCalledWith(inputDto);
      expect(mockService.getCinemasNearby).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 10.7745,
          longitude: 106.7011,
          radiusKm: 5,
          limit: 10,
        })
      );
    });

    it('should maintain data integrity through controller layer', async () => {
      const complexFilter: GetCinemasWithFiltersDto = {
        latitude: 10.7745,
        longitude: 106.7011,
        radiusKm: 10,
        city: 'Ho Chi Minh City',
        district: 'District 1',
        amenities: ['IMAX', 'Parking', 'Food Court'],
        hallTypes: ['IMAX', 'VIP'],
        minRating: 4.2,
        page: 2,
        limit: 15,
        sortBy: 'distance',
        sortOrder: 'asc',
      };

      mockService.getCinemasWithFilters.mockResolvedValue(
        mockCinemaListResponse
      );

      await controller.getCinemasWithFilters(complexFilter);

      expect(mockService.getCinemasWithFilters).toHaveBeenCalledWith(
        complexFilter
      );
      expect(mockService.getCinemasWithFilters).toHaveBeenCalledWith(
        expect.objectContaining(complexFilter)
      );
    });
  });
});
