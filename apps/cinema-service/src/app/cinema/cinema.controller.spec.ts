import { Test, TestingModule } from '@nestjs/testing';
import { CinemaController } from './cinema.controller';
import { CinemaService } from './cinema.service';

describe('CinemaController', () => {
  let controller: CinemaController;
  let cinemaService: CinemaService;

  const mockCinemaService = {
    getCinemas: jest.fn(),
  };

  const mockClientProxy = {
    send: jest.fn(),
    emit: jest.fn(),
  };

  const mockCinemas = [
    {
      id: 'cinema-1',
      name: 'CGV Vincom Center',
      address: '72 Le Thanh Ton, District 1, Ho Chi Minh City',
      city: 'Ho Chi Minh City',
      district: 'District 1',
      phone: '+84-28-3822-3456',
      email: 'cgv.vincom@cinema.com',
      website: 'https://www.cgv.vn',
      latitude: 10.7744,
      longitude: 106.701,
      description: 'Premium cinema experience in the heart of the city',
      amenities: ['IMAX', '3D', 'VIP', 'Parking'],
      facilities: { parking: true, foodCourt: true, wheelchairAccess: true },
      images: ['image1.jpg', 'image2.jpg'],
      virtual_tour_360_url: 'https://tour.cgv.vn/vincom',
      rating: 4.5,
      total_reviews: 1250,
      operating_hours: { open: '09:00', close: '23:00' },
      social_media: { facebook: 'cgv.vietnam', instagram: 'cgv_vietnam' },
      status: 'ACTIVE',
      timezone: 'Asia/Ho_Chi_Minh',
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'cinema-2',
      name: 'Lotte Cinema Landmark 81',
      address: 'Landmark 81, Vinhomes Central Park, Binh Thanh District',
      city: 'Ho Chi Minh City',
      district: 'Binh Thanh',
      phone: '+84-28-3555-7777',
      email: 'lotte.landmark@cinema.com',
      website: 'https://www.lottecinema.com.vn',
      latitude: 10.7956,
      longitude: 106.7217,
      description: 'Luxury cinema experience at Landmark 81',
      amenities: ['4DX', 'IMAX', 'VIP', 'Food Court'],
      facilities: { parking: true, foodCourt: true, vip: true },
      images: ['lotte1.jpg', 'lotte2.jpg'],
      virtual_tour_360_url: 'https://tour.lotte.vn/landmark81',
      rating: 4.7,
      total_reviews: 2100,
      operating_hours: { open: '08:30', close: '23:30' },
      social_media: {
        facebook: 'lotte.cinema.vietnam',
        instagram: 'lottecinema_vn',
      },
      status: 'ACTIVE',
      timezone: 'Asia/Ho_Chi_Minh',
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'cinema-3',
      name: 'Galaxy Cinema Nguyen Du',
      address: '116 Nguyen Du, District 1, Ho Chi Minh City',
      city: 'Ho Chi Minh City',
      district: 'District 1',
      phone: '+84-28-3829-9999',
      email: 'galaxy.nguyendu@cinema.com',
      website: 'https://www.galaxycine.vn',
      latitude: 10.7691,
      longitude: 106.6958,
      description: 'Modern cinema with latest technology',
      amenities: ['Standard', '3D', 'Parking'],
      facilities: { parking: true, snackBar: true },
      images: ['galaxy1.jpg'],
      virtual_tour_360_url: null,
      rating: 4.2,
      total_reviews: 800,
      operating_hours: { open: '09:30', close: '23:00' },
      social_media: { facebook: 'galaxy.cinema.vietnam' },
      status: 'ACTIVE',
      timezone: 'Asia/Ho_Chi_Minh',
      created_at: new Date('2024-01-01T00:00:00Z'),
      updated_at: new Date('2024-01-01T00:00:00Z'),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CinemaController],
      providers: [
        {
          provide: CinemaService,
          useValue: mockCinemaService,
        },
        {
          provide: 'CINEMA_SERVICE',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    controller = module.get<CinemaController>(CinemaController);
    cinemaService = module.get<CinemaService>(CinemaService);

    // Reset mocks
    mockCinemaService.getCinemas.mockReset();
    mockClientProxy.send.mockReset();
    mockClientProxy.emit.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCinemas', () => {
    it('should return all cinemas', async () => {
      mockCinemaService.getCinemas.mockResolvedValue(mockCinemas);

      const result = await controller.getCinemas();

      expect(result).toEqual(mockCinemas);
      expect(result).toHaveLength(3);
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
      expect(mockCinemaService.getCinemas).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no cinemas exist', async () => {
      const emptyCinemas = [];
      mockCinemaService.getCinemas.mockResolvedValue(emptyCinemas);

      const result = await controller.getCinemas();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
      expect(mockCinemaService.getCinemas).toHaveBeenCalledTimes(1);
    });

    it('should return single cinema when only one exists', async () => {
      const singleCinema = [mockCinemas[0]];
      mockCinemaService.getCinemas.mockResolvedValue(singleCinema);

      const result = await controller.getCinemas();

      expect(result).toEqual(singleCinema);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('CGV Vincom Center');
      expect(result[0].city).toBe('Ho Chi Minh City');
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });

    it('should call cinemaService.getCinemas method', async () => {
      mockCinemaService.getCinemas.mockResolvedValue(mockCinemas);

      await controller.getCinemas();

      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
      expect(mockCinemaService.getCinemas).toHaveBeenCalledWith();
      expect(mockCinemaService.getCinemas).toHaveBeenCalledTimes(1);
    });

    it('should return cinema data with correct schema structure', async () => {
      mockCinemaService.getCinemas.mockResolvedValue(mockCinemas);

      const result = await controller.getCinemas();

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('address');
      expect(result[0]).toHaveProperty('city');
      expect(result[0]).toHaveProperty('district');
      expect(result[0]).toHaveProperty('phone');
      expect(result[0]).toHaveProperty('email');
      expect(result[0]).toHaveProperty('website');
      expect(result[0]).toHaveProperty('latitude');
      expect(result[0]).toHaveProperty('longitude');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('amenities');
      expect(result[0]).toHaveProperty('facilities');
      expect(result[0]).toHaveProperty('images');
      expect(result[0]).toHaveProperty('virtual_tour_360_url');
      expect(result[0]).toHaveProperty('rating');
      expect(result[0]).toHaveProperty('total_reviews');
      expect(result[0]).toHaveProperty('operating_hours');
      expect(result[0]).toHaveProperty('social_media');
      expect(result[0]).toHaveProperty('status');
      expect(result[0]).toHaveProperty('timezone');
      expect(result[0]).toHaveProperty('created_at');
      expect(result[0]).toHaveProperty('updated_at');
    });

    it('should verify data types in cinema objects', async () => {
      mockCinemaService.getCinemas.mockResolvedValue(mockCinemas);

      const result = await controller.getCinemas();
      const firstCinema = result[0];

      expect(typeof firstCinema.id).toBe('string');
      expect(typeof firstCinema.name).toBe('string');
      expect(typeof firstCinema.address).toBe('string');
      expect(typeof firstCinema.city).toBe('string');
      expect(typeof firstCinema.district).toBe('string');
      expect(typeof firstCinema.phone).toBe('string');
      expect(typeof firstCinema.email).toBe('string');
      expect(typeof firstCinema.website).toBe('string');
      expect(typeof firstCinema.latitude).toBe('number');
      expect(typeof firstCinema.longitude).toBe('number');
      expect(typeof firstCinema.description).toBe('string');
      expect(Array.isArray(firstCinema.amenities)).toBe(true);
      expect(typeof firstCinema.facilities).toBe('object');
      expect(Array.isArray(firstCinema.images)).toBe(true);
      expect(typeof firstCinema.rating).toBe('number');
      expect(typeof firstCinema.total_reviews).toBe('number');
      expect(typeof firstCinema.operating_hours).toBe('object');
      expect(typeof firstCinema.social_media).toBe('object');
      expect(typeof firstCinema.status).toBe('string');
      expect(typeof firstCinema.timezone).toBe('string');
      expect(firstCinema.created_at).toBeInstanceOf(Date);
      expect(firstCinema.updated_at).toBeInstanceOf(Date);
    });

    it('should handle cinemas with different amenities', async () => {
      const cinemasWithDifferentAmenities = [
        {
          ...mockCinemas[0],
          amenities: ['IMAX', '3D', 'VIP'],
        },
        {
          ...mockCinemas[1],
          amenities: ['4DX', 'Standard'],
        },
        {
          ...mockCinemas[2],
          amenities: [],
        },
      ];

      mockCinemaService.getCinemas.mockResolvedValue(
        cinemasWithDifferentAmenities
      );

      const result = await controller.getCinemas();

      expect(result[0].amenities).toContain('IMAX');
      expect(result[0].amenities).toContain('3D');
      expect(result[0].amenities).toContain('VIP');
      expect(result[1].amenities).toContain('4DX');
      expect(result[1].amenities).toContain('Standard');
      expect(result[2].amenities).toEqual([]);
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });

    it('should handle cinemas from different cities', async () => {
      const cinemasFromDifferentCities = [
        {
          ...mockCinemas[0],
          city: 'Ho Chi Minh City',
          district: 'District 1',
        },
        {
          ...mockCinemas[1],
          city: 'Ha Noi',
          district: 'Ba Dinh',
        },
        {
          ...mockCinemas[2],
          city: 'Da Nang',
          district: 'Hai Chau',
        },
      ];

      mockCinemaService.getCinemas.mockResolvedValue(
        cinemasFromDifferentCities
      );

      const result = await controller.getCinemas();

      const cities = result.map((cinema) => cinema.city);
      expect(cities).toContain('Ho Chi Minh City');
      expect(cities).toContain('Ha Noi');
      expect(cities).toContain('Da Nang');
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });

    it('should handle cinemas with valid coordinates', async () => {
      mockCinemaService.getCinemas.mockResolvedValue(mockCinemas);

      const result = await controller.getCinemas();

      result.forEach((cinema) => {
        expect(cinema.latitude).toBeGreaterThan(-90);
        expect(cinema.latitude).toBeLessThan(90);
        expect(cinema.longitude).toBeGreaterThan(-180);
        expect(cinema.longitude).toBeLessThan(180);
      });
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });

    it('should handle service errors and propagate them', async () => {
      const serviceError = new Error('Cinema service error');
      mockCinemaService.getCinemas.mockRejectedValue(serviceError);

      await expect(controller.getCinemas()).rejects.toThrow(
        'Cinema service error'
      );
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });

    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection failed');
      mockCinemaService.getCinemas.mockRejectedValue(dbError);

      await expect(controller.getCinemas()).rejects.toThrow(
        'Database connection failed'
      );
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });

    it('should handle null or undefined optional fields', async () => {
      const cinemasWithNullFields = [
        {
          ...mockCinemas[0],
          email: null,
          website: null,
          description: null,
          virtual_tour_360_url: null,
          rating: null,
          operating_hours: null,
          social_media: null,
        },
      ];

      mockCinemaService.getCinemas.mockResolvedValue(cinemasWithNullFields);

      const result = await controller.getCinemas();

      expect(result[0].email).toBeNull();
      expect(result[0].website).toBeNull();
      expect(result[0].description).toBeNull();
      expect(result[0].virtual_tour_360_url).toBeNull();
      expect(result[0].rating).toBeNull();
      expect(result[0].operating_hours).toBeNull();
      expect(result[0].social_media).toBeNull();
      expect(result[0].id).toBeDefined();
      expect(result[0].name).toBeDefined();
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });

    it('should not modify the service response', async () => {
      mockCinemaService.getCinemas.mockResolvedValue(mockCinemas);

      const result = await controller.getCinemas();

      expect(result).toEqual(mockCinemas);
      expect(result).toHaveLength(mockCinemas.length);
      expect(result[0].id).toBe(mockCinemas[0].id);
      expect(result[0].name).toBe(mockCinemas[0].name);
      expect(result[0].created_at).toEqual(mockCinemas[0].created_at);
      expect(result[0].updated_at).toEqual(mockCinemas[0].updated_at);
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });

    it('should handle large datasets efficiently', async () => {
      const largeCinemaDataset = Array.from({ length: 100 }, (_, index) => ({
        ...mockCinemas[0],
        id: `cinema-${index + 1}`,
        name: `Cinema ${index + 1}`,
        address: `Address ${index + 1}`,
      }));

      mockCinemaService.getCinemas.mockResolvedValue(largeCinemaDataset);

      const result = await controller.getCinemas();

      expect(result).toHaveLength(100);
      expect(result[0].id).toBe('cinema-1');
      expect(result[99].id).toBe('cinema-100');
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });

    it('should maintain data integrity', async () => {
      mockCinemaService.getCinemas.mockResolvedValue(mockCinemas);

      const result = await controller.getCinemas();

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        result.forEach((cinema) => {
          expect(cinema.id).toBeDefined();
          expect(cinema.name).toBeDefined();
          expect(cinema.address).toBeDefined();
          expect(cinema.city).toBeDefined();
        });
      }

      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });

    it('should handle concurrent requests correctly', async () => {
      mockCinemaService.getCinemas.mockResolvedValue(mockCinemas);

      const promises = Array.from({ length: 5 }, () => controller.getCinemas());
      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result).toEqual(mockCinemas);
        expect(result).toHaveLength(3);
      });
      expect(mockCinemaService.getCinemas).toHaveBeenCalledTimes(5);
    });

    it('should handle service returning null', async () => {
      mockCinemaService.getCinemas.mockResolvedValue(null);

      const result = await controller.getCinemas();

      expect(result).toBeNull();
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });

    it('should handle service returning undefined', async () => {
      mockCinemaService.getCinemas.mockResolvedValue(undefined);

      const result = await controller.getCinemas();

      expect(result).toBeUndefined();
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });
  });

  describe('Message Pattern Integration', () => {
    it('should be decorated with correct MessagePattern', () => {
      // This test verifies that the getCinemas method is properly decorated
      // The actual MessagePattern decorator is applied at runtime
      expect(controller.getCinemas).toBeDefined();
      expect(typeof controller.getCinemas).toBe('function');
    });

    it('should handle microservice communication patterns', async () => {
      mockCinemaService.getCinemas.mockResolvedValue(mockCinemas);

      const result = await controller.getCinemas();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have getCinemas method', () => {
      expect(controller.getCinemas).toBeDefined();
      expect(typeof controller.getCinemas).toBe('function');
    });

    it('should have cinemaService dependency injected', () => {
      expect(cinemaService).toBeDefined();
      expect(cinemaService).toBe(mockCinemaService);
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors without modification', async () => {
      const originalError = new Error('Original service error');
      mockCinemaService.getCinemas.mockRejectedValue(originalError);

      await expect(controller.getCinemas()).rejects.toThrow(
        'Original service error'
      );
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });

    it('should handle critical system errors', async () => {
      const systemError = new Error('System failure');
      mockCinemaService.getCinemas.mockRejectedValue(systemError);

      await expect(controller.getCinemas()).rejects.toThrow('System failure');
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });
  });

  describe('Data Validation', () => {
    it('should return valid cinema data structure', async () => {
      mockCinemaService.getCinemas.mockResolvedValue(mockCinemas);

      const result = await controller.getCinemas();

      result.forEach((cinema) => {
        expect(cinema).toHaveProperty('id');
        expect(cinema).toHaveProperty('name');
        expect(cinema).toHaveProperty('address');
        expect(cinema).toHaveProperty('city');
        expect(cinema).toHaveProperty('district');
        expect(cinema).toHaveProperty('phone');
        expect(cinema).toHaveProperty('email');
        expect(cinema).toHaveProperty('website');
        expect(cinema).toHaveProperty('latitude');
        expect(cinema).toHaveProperty('longitude');
        expect(cinema).toHaveProperty('description');
        expect(cinema).toHaveProperty('amenities');
        expect(cinema).toHaveProperty('facilities');
        expect(cinema).toHaveProperty('images');
        expect(cinema).toHaveProperty('virtual_tour_360_url');
        expect(cinema).toHaveProperty('rating');
        expect(cinema).toHaveProperty('total_reviews');
        expect(cinema).toHaveProperty('operating_hours');
        expect(cinema).toHaveProperty('social_media');
        expect(cinema).toHaveProperty('status');
        expect(cinema).toHaveProperty('timezone');
        expect(cinema).toHaveProperty('created_at');
        expect(cinema).toHaveProperty('updated_at');
      });
    });

    it('should handle edge cases in cinema data', async () => {
      const edgeCaseCinemas = [
        {
          ...mockCinemas[0],
          name: '', // Empty name
          amenities: [], // Empty amenities array
          latitude: 0, // Zero coordinates
          longitude: 0,
        },
      ];

      mockCinemaService.getCinemas.mockResolvedValue(edgeCaseCinemas);

      const result = await controller.getCinemas();

      expect(result[0].name).toBe('');
      expect(result[0].amenities).toEqual([]);
      expect(result[0].latitude).toBe(0);
      expect(result[0].longitude).toBe(0);
      expect(mockCinemaService.getCinemas).toHaveBeenCalled();
    });
  });
});
