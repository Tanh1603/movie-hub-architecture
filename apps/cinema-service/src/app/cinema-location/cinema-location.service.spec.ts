import { Test, TestingModule } from '@nestjs/testing';
import { CinemaLocationService } from './cinema-location.service';
import { PrismaService } from '../prisma.service';
import { CinemaLocationMapper } from './cinema-location.mapper';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  GetCinemasNearbyDto,
  GetCinemasWithFiltersDto,
  GetCinemaDetailDto,
} from './dto/cinema-location.dto';
import Decimal from 'decimal.js';

describe('CinemaLocationService', () => {
  let service: CinemaLocationService;

  const mockPrismaService = {
    cinemas: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockMapper = {
    toCinemaLocationList: jest.fn(),
    toCinemaLocationResponse: jest.fn(),
  };

  const mockCinemaWithHalls = {
    id: 'cinema-1',
    name: 'CGV Vincom Center',
    address: '72 Le Thanh Ton, District 1, Ho Chi Minh City',
    city: 'Ho Chi Minh City',
    district: 'District 1',
    phone: '+84-28-3822-3456',
    email: 'cgv.vincom@cinema.com',
    website: 'https://www.cgv.vn',
    latitude: new Decimal('10.7744'),
    longitude: new Decimal('106.7010'),
    description: 'Premium cinema experience in the heart of the city',
    amenities: ['IMAX', '3D', 'VIP', 'Parking'],
    facilities: { parking: true, foodCourt: true },
    images: ['image1.jpg', 'image2.jpg'],
    virtual_tour_360_url: 'https://tour.cgv.vn/vincom',
    rating: new Decimal('4.5'),
    total_reviews: 1250,
    operating_hours: { monday: { open: '09:00', close: '23:00' } },
    social_media: { facebook: 'cgv.vietnam' },
    status: 'ACTIVE',
    timezone: 'Asia/Ho_Chi_Minh',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
    halls: [
      {
        id: 'hall-1',
        cinema_id: 'cinema-1',
        name: 'Hall 1',
        type: 'IMAX',
        capacity: 200,
        rows: 10,
        screen_type: 'IMAX',
        sound_system: 'Dolby Atmos',
        features: ['3D', 'Reclining seats'],
        layout_data: null,
        status: 'ACTIVE',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      },
      {
        id: 'hall-2',
        cinema_id: 'cinema-1',
        name: 'Hall 2',
        type: 'VIP',
        capacity: 50,
        rows: 5,
        screen_type: 'Standard',
        sound_system: 'Dolby Digital',
        features: ['VIP seating', 'Food service'],
        layout_data: null,
        status: 'ACTIVE',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      },
    ],
  };

  const mockCinemaResponse = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CinemaLocationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CinemaLocationMapper,
          useValue: mockMapper,
        },
      ],
    }).compile();

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
      mockPrismaService.cinemas.findMany.mockResolvedValue([
        mockCinemaWithHalls,
      ]);
      mockMapper.toCinemaLocationList.mockReturnValue([mockCinemaResponse]);

      const result = await service.getCinemasNearby(validDto);

      expect(result).toEqual({
        cinemas: [mockCinemaResponse],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      });
      expect(mockPrismaService.cinemas.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          latitude: expect.any(Object),
          longitude: expect.any(Object),
        },
        include: { halls: true },
      });
      expect(mockMapper.toCinemaLocationList).toHaveBeenCalledWith(
        expect.any(Array),
        validDto.latitude,
        validDto.longitude
      );
    });

    it('should throw BadRequestException when latitude is missing', async () => {
      const invalidDto = { longitude: 106.7011 } as GetCinemasNearbyDto;

      await expect(service.getCinemasNearby(invalidDto)).rejects.toThrow(
        new BadRequestException('Latitude and longitude are required')
      );
    });

    it('should throw BadRequestException when longitude is missing', async () => {
      const invalidDto = { latitude: 10.7745 } as GetCinemasNearbyDto;

      await expect(service.getCinemasNearby(invalidDto)).rejects.toThrow(
        new BadRequestException('Latitude and longitude are required')
      );
    });

    it('should use default values when radiusKm and limit are not provided', async () => {
      const dtoWithDefaults = {
        latitude: 10.7745,
        longitude: 106.7011,
      };

      mockPrismaService.cinemas.findMany.mockResolvedValue([]);
      mockMapper.toCinemaLocationList.mockReturnValue([]);

      const result = await service.getCinemasNearby(dtoWithDefaults);

      expect(result.limit).toBe(20); // default limit
      expect(mockPrismaService.cinemas.findMany).toHaveBeenCalled();
    });

    it('should filter cinemas by distance correctly', async () => {
      const farCinema = {
        ...mockCinemaWithHalls,
        id: 'cinema-far',
        latitude: new Decimal('20.0000'), // Very far latitude
        longitude: new Decimal('120.0000'), // Very far longitude
      };

      mockPrismaService.cinemas.findMany.mockResolvedValue([
        mockCinemaWithHalls,
        farCinema,
      ]);
      mockMapper.toCinemaLocationList.mockReturnValue([mockCinemaResponse]);

      const result = await service.getCinemasNearby({
        ...validDto,
        radiusKm: 5, // Small radius
      });

      // Should only return cinemas within radius
      expect(result.total).toBeLessThanOrEqual(1);
      expect(mockMapper.toCinemaLocationList).toHaveBeenCalled();
    });

    it('should limit results correctly', async () => {
      const multipleCinemas = Array.from({ length: 30 }, (_, i) => ({
        ...mockCinemaWithHalls,
        id: `cinema-${i}`,
      }));

      mockPrismaService.cinemas.findMany.mockResolvedValue(multipleCinemas);
      mockMapper.toCinemaLocationList.mockReturnValue(
        Array.from({ length: 10 }, (_, i) => ({
          ...mockCinemaResponse,
          id: `cinema-${i}`,
        }))
      );

      const result = await service.getCinemasNearby({
        ...validDto,
        limit: 10,
      });

      expect(result.limit).toBe(10);
      expect(result.cinemas.length).toBeLessThanOrEqual(10);
    });

    it('should handle cinemas without coordinates', async () => {
      const cinemaWithoutCoords = {
        ...mockCinemaWithHalls,
        latitude: null,
        longitude: null,
      };

      mockPrismaService.cinemas.findMany.mockResolvedValue([
        cinemaWithoutCoords,
      ]);
      mockMapper.toCinemaLocationList.mockReturnValue([]);

      const result = await service.getCinemasNearby(validDto);

      expect(result.cinemas).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle empty results from database', async () => {
      mockPrismaService.cinemas.findMany.mockResolvedValue([]);
      mockMapper.toCinemaLocationList.mockReturnValue([]);

      const result = await service.getCinemasNearby(validDto);

      expect(result).toEqual({
        cinemas: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false,
      });
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.cinemas.findMany.mockRejectedValue(dbError);

      await expect(service.getCinemasNearby(validDto)).rejects.toThrow(
        'Database connection failed'
      );
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
      mockPrismaService.cinemas.findMany.mockResolvedValue([
        mockCinemaWithHalls,
      ]);
      mockMapper.toCinemaLocationList.mockReturnValue([mockCinemaResponse]);

      const result = await service.getCinemasWithFilters(validFilter);

      expect(result).toEqual({
        cinemas: [mockCinemaResponse],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false,
      });
      expect(mockPrismaService.cinemas.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: 'ACTIVE',
          city: { contains: 'Ho Chi Minh City', mode: 'insensitive' },
          district: { contains: 'District 1', mode: 'insensitive' },
          rating: { gte: expect.any(Object) },
          amenities: { hasEvery: ['IMAX', 'Parking'] },
          halls: { some: { type: { in: ['IMAX', 'VIP'] } } },
        }),
        include: { halls: true },
      });
    });

    it('should work with minimal filters', async () => {
      const minimalFilter = {};

      mockPrismaService.cinemas.findMany.mockResolvedValue([
        mockCinemaWithHalls,
      ]);
      mockMapper.toCinemaLocationList.mockReturnValue([mockCinemaResponse]);

      const result = await service.getCinemasWithFilters(minimalFilter);

      expect(result.page).toBe(1); // default page
      expect(result.limit).toBe(20); // default limit
      expect(mockPrismaService.cinemas.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        include: { halls: true },
      });
    });

    it('should filter by city only', async () => {
      const cityFilter = { city: 'Ha Noi' };

      mockPrismaService.cinemas.findMany.mockResolvedValue([]);
      mockMapper.toCinemaLocationList.mockReturnValue([]);

      await service.getCinemasWithFilters(cityFilter);

      expect(mockPrismaService.cinemas.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          city: { contains: 'Ha Noi', mode: 'insensitive' },
        },
        include: { halls: true },
      });
    });

    it('should filter by district only', async () => {
      const districtFilter = { district: 'Ba Dinh' };

      mockPrismaService.cinemas.findMany.mockResolvedValue([]);
      mockMapper.toCinemaLocationList.mockReturnValue([]);

      await service.getCinemasWithFilters(districtFilter);

      expect(mockPrismaService.cinemas.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          district: { contains: 'Ba Dinh', mode: 'insensitive' },
        },
        include: { halls: true },
      });
    });

    it('should filter by minimum rating', async () => {
      const ratingFilter = { minRating: 4.5 };

      mockPrismaService.cinemas.findMany.mockResolvedValue([]);
      mockMapper.toCinemaLocationList.mockReturnValue([]);

      await service.getCinemasWithFilters(ratingFilter);

      expect(mockPrismaService.cinemas.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          rating: { gte: expect.any(Object) },
        },
        include: { halls: true },
      });
    });

    it('should filter by amenities', async () => {
      const amenitiesFilter = { amenities: ['IMAX', '3D'] };

      mockPrismaService.cinemas.findMany.mockResolvedValue([]);
      mockMapper.toCinemaLocationList.mockReturnValue([]);

      await service.getCinemasWithFilters(amenitiesFilter);

      expect(mockPrismaService.cinemas.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          amenities: { hasEvery: ['IMAX', '3D'] },
        },
        include: { halls: true },
      });
    });

    it('should filter by hall types', async () => {
      const hallTypesFilter = { hallTypes: ['IMAX', 'VIP'] };

      mockPrismaService.cinemas.findMany.mockResolvedValue([]);
      mockMapper.toCinemaLocationList.mockReturnValue([]);

      await service.getCinemasWithFilters(hallTypesFilter);

      expect(mockPrismaService.cinemas.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          halls: { some: { type: { in: ['IMAX', 'VIP'] } } },
        },
        include: { halls: true },
      });
    });

    it('should sort by distance ascending', async () => {
      const cinemas = [
        {
          ...mockCinemaResponse,
          id: 'cinema-1',
          location: { ...mockCinemaResponse.location, distance: 5.0 },
        },
        {
          ...mockCinemaResponse,
          id: 'cinema-2',
          location: { ...mockCinemaResponse.location, distance: 2.0 },
        },
        {
          ...mockCinemaResponse,
          id: 'cinema-3',
          location: { ...mockCinemaResponse.location, distance: 8.0 },
        },
      ];

      mockPrismaService.cinemas.findMany.mockResolvedValue([
        mockCinemaWithHalls,
      ]);
      mockMapper.toCinemaLocationList.mockReturnValue(cinemas);

      const result = await service.getCinemasWithFilters({
        latitude: 10.7745,
        longitude: 106.7011,
        sortBy: 'distance',
        sortOrder: 'asc',
      });

      expect(result.cinemas[0].location.distance).toBeLessThanOrEqual(
        result.cinemas[1].location.distance || 0
      );
    });

    it('should sort by rating descending', async () => {
      const cinemas = [
        { ...mockCinemaResponse, id: 'cinema-1', rating: 4.0 },
        { ...mockCinemaResponse, id: 'cinema-2', rating: 4.8 },
        { ...mockCinemaResponse, id: 'cinema-3', rating: 3.5 },
      ];

      mockPrismaService.cinemas.findMany.mockResolvedValue([
        mockCinemaWithHalls,
      ]);
      mockMapper.toCinemaLocationList.mockReturnValue(cinemas);

      const result = await service.getCinemasWithFilters({
        sortBy: 'rating',
        sortOrder: 'desc',
      });

      expect(result.cinemas[0].rating).toBeGreaterThanOrEqual(
        result.cinemas[1].rating || 0
      );
    });

    it('should sort by name ascending', async () => {
      const cinemas = [
        { ...mockCinemaResponse, id: 'cinema-1', name: 'Z Cinema' },
        { ...mockCinemaResponse, id: 'cinema-2', name: 'A Cinema' },
        { ...mockCinemaResponse, id: 'cinema-3', name: 'M Cinema' },
      ];

      mockPrismaService.cinemas.findMany.mockResolvedValue([
        mockCinemaWithHalls,
      ]);
      mockMapper.toCinemaLocationList.mockReturnValue(cinemas);

      const result = await service.getCinemasWithFilters({
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(
        result.cinemas[0].name.localeCompare(result.cinemas[1].name)
      ).toBeLessThanOrEqual(0);
    });

    it('should handle pagination correctly', async () => {
      const manyCinemas = Array.from({ length: 50 }, (_, i) => ({
        ...mockCinemaResponse,
        id: `cinema-${i}`,
      }));

      mockPrismaService.cinemas.findMany.mockResolvedValue([
        mockCinemaWithHalls,
      ]);
      mockMapper.toCinemaLocationList.mockReturnValue(manyCinemas);

      const result = await service.getCinemasWithFilters({
        page: 2,
        limit: 10,
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.cinemas.length).toBeLessThanOrEqual(10);
      expect(result.hasMore).toBe(true);
    });

    it('should filter by distance when location is provided', async () => {
      const filterWithLocation = {
        latitude: 10.7745,
        longitude: 106.7011,
        radiusKm: 5,
      };

      mockPrismaService.cinemas.findMany.mockResolvedValue([
        mockCinemaWithHalls,
      ]);
      mockMapper.toCinemaLocationList.mockReturnValue([mockCinemaResponse]);

      await service.getCinemasWithFilters(filterWithLocation);

      expect(mockMapper.toCinemaLocationList).toHaveBeenCalledWith(
        expect.any(Array),
        filterWithLocation.latitude,
        filterWithLocation.longitude
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
      mockPrismaService.cinemas.findUnique.mockResolvedValue(
        mockCinemaWithHalls
      );
      mockMapper.toCinemaLocationResponse.mockReturnValue(mockCinemaResponse);

      const result = await service.getCinemaDetail(validDto);

      expect(result).toEqual(mockCinemaResponse);
      expect(mockPrismaService.cinemas.findUnique).toHaveBeenCalledWith({
        where: { id: 'cinema-1' },
        include: { halls: true },
      });
      expect(mockMapper.toCinemaLocationResponse).toHaveBeenCalledWith(
        mockCinemaWithHalls,
        validDto.userLatitude,
        validDto.userLongitude
      );
    });

    it('should throw NotFoundException when cinema is not found', async () => {
      mockPrismaService.cinemas.findUnique.mockResolvedValue(null);

      await expect(service.getCinemaDetail(validDto)).rejects.toThrow(
        new NotFoundException('Cinema with ID cinema-1 not found')
      );
    });

    it('should work without user location', async () => {
      const dtoWithoutLocation = { cinemaId: 'cinema-1' };

      mockPrismaService.cinemas.findUnique.mockResolvedValue(
        mockCinemaWithHalls
      );
      mockMapper.toCinemaLocationResponse.mockReturnValue(mockCinemaResponse);

      await service.getCinemaDetail(dtoWithoutLocation);

      expect(mockMapper.toCinemaLocationResponse).toHaveBeenCalledWith(
        mockCinemaWithHalls,
        undefined,
        undefined
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.cinemas.findUnique.mockRejectedValue(dbError);

      await expect(service.getCinemaDetail(validDto)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('searchCinemas', () => {
    const searchQuery = 'CGV';
    const userLatitude = 10.7745;
    const userLongitude = 106.7011;

    it('should search cinemas successfully', async () => {
      mockPrismaService.cinemas.findMany.mockResolvedValue([
        mockCinemaWithHalls,
      ]);
      mockMapper.toCinemaLocationList.mockReturnValue([mockCinemaResponse]);

      const result = await service.searchCinemas(
        searchQuery,
        userLatitude,
        userLongitude
      );

      expect(result).toEqual([mockCinemaResponse]);
      expect(mockPrismaService.cinemas.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { address: { contains: searchQuery, mode: 'insensitive' } },
            { city: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
        include: { halls: true },
        take: 20,
      });
      expect(mockMapper.toCinemaLocationList).toHaveBeenCalledWith(
        [mockCinemaWithHalls],
        userLatitude,
        userLongitude
      );
    });

    it('should search without user location', async () => {
      mockPrismaService.cinemas.findMany.mockResolvedValue([
        mockCinemaWithHalls,
      ]);
      mockMapper.toCinemaLocationList.mockReturnValue([mockCinemaResponse]);

      await service.searchCinemas(searchQuery);

      expect(mockMapper.toCinemaLocationList).toHaveBeenCalledWith(
        [mockCinemaWithHalls],
        undefined,
        undefined
      );
    });

    it('should return empty results when no matches found', async () => {
      mockPrismaService.cinemas.findMany.mockResolvedValue([]);
      mockMapper.toCinemaLocationList.mockReturnValue([]);

      const result = await service.searchCinemas('NonExistent');

      expect(result).toEqual([]);
    });

    it('should limit results to 20', async () => {
      mockPrismaService.cinemas.findMany.mockResolvedValue([
        mockCinemaWithHalls,
      ]);

      await service.searchCinemas(searchQuery);

      expect(mockPrismaService.cinemas.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20 })
      );
    });
  });

  describe('getAvailableCities', () => {
    it('should return available cities successfully', async () => {
      const mockCities = [
        { city: 'Ho Chi Minh City' },
        { city: 'Ha Noi' },
        { city: 'Da Nang' },
      ];

      mockPrismaService.cinemas.findMany.mockResolvedValue(mockCities);

      const result = await service.getAvailableCities();

      expect(result).toEqual(['Ho Chi Minh City', 'Ha Noi', 'Da Nang']);
      expect(mockPrismaService.cinemas.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        select: { city: true },
        distinct: ['city'],
        orderBy: { city: 'asc' },
      });
    });

    it('should return empty array when no cities found', async () => {
      mockPrismaService.cinemas.findMany.mockResolvedValue([]);

      const result = await service.getAvailableCities();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.cinemas.findMany.mockRejectedValue(dbError);

      await expect(service.getAvailableCities()).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('getAvailableDistricts', () => {
    const city = 'Ho Chi Minh City';

    it('should return available districts for a city successfully', async () => {
      const mockDistricts = [
        { district: 'District 1' },
        { district: 'District 3' },
        { district: 'Binh Thanh' },
      ];

      mockPrismaService.cinemas.findMany.mockResolvedValue(mockDistricts);

      const result = await service.getAvailableDistricts(city);

      expect(result).toEqual(['District 1', 'District 3', 'Binh Thanh']);
      expect(mockPrismaService.cinemas.findMany).toHaveBeenCalledWith({
        where: {
          city: { contains: city, mode: 'insensitive' },
          status: 'ACTIVE',
          district: { not: null },
        },
        select: { district: true },
        distinct: ['district'],
        orderBy: { district: 'asc' },
      });
    });

    it('should filter out null districts', async () => {
      const mockDistricts = [
        { district: 'District 1' },
        { district: null },
        { district: 'District 3' },
      ];

      mockPrismaService.cinemas.findMany.mockResolvedValue(mockDistricts);

      const result = await service.getAvailableDistricts(city);

      expect(result).toEqual(['District 1', 'District 3']);
    });

    it('should return empty array when no districts found', async () => {
      mockPrismaService.cinemas.findMany.mockResolvedValue([]);

      const result = await service.getAvailableDistricts(city);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.cinemas.findMany.mockRejectedValue(dbError);

      await expect(service.getAvailableDistricts(city)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(service.getCinemasNearby).toBeDefined();
      expect(service.getCinemasWithFilters).toBeDefined();
      expect(service.getCinemaDetail).toBeDefined();
      expect(service.searchCinemas).toBeDefined();
      expect(service.getAvailableCities).toBeDefined();
      expect(service.getAvailableDistricts).toBeDefined();
    });
  });

  describe('Helper Methods', () => {
    it('should convert numbers to Decimal correctly', () => {
      // These are private methods, but we can test their effects through public methods
      const dto = {
        latitude: 10.7745,
        longitude: 106.7011,
        radiusKm: 5,
      };

      mockPrismaService.cinemas.findMany.mockResolvedValue([]);
      mockMapper.toCinemaLocationList.mockReturnValue([]);

      expect(() => service.getCinemasNearby(dto)).not.toThrow();
    });

    it('should handle Decimal to number conversion correctly', async () => {
      const cinemaWithDecimalCoords = {
        ...mockCinemaWithHalls,
        latitude: new Decimal('10.7744'),
        longitude: new Decimal('106.7010'),
      };

      mockPrismaService.cinemas.findMany.mockResolvedValue([
        cinemaWithDecimalCoords,
      ]);
      mockMapper.toCinemaLocationList.mockReturnValue([mockCinemaResponse]);

      const result = await service.getCinemasNearby({
        latitude: 10.7745,
        longitude: 106.7011,
        radiusKm: 10,
      });

      expect(result).toBeDefined();
      expect(result.cinemas).toBeDefined();
    });
  });
});
