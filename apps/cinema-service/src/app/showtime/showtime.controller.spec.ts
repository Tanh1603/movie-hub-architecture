import { Test, TestingModule } from '@nestjs/testing';
import { ShowtimeController } from './showtime.controller';
import { ShowtimeService } from './showtime.service';
import {
  GetShowtimesQuery,
  ShowtimeSummaryResponse,
  ShowtimeSeatResponse,
  ShowtimeStatusEnum,
  DayTypeEnum,
  TimeSlotEnum,
  FormatEnum,
  SeatTypeEnum,
  SeatStatusEnum,
  TicketTypeEnum,
  ReservationStatusEnum,
} from '@movie-hub/shared-types';

// Mock data
const mockShowtimeSummaryResponse: ShowtimeSummaryResponse = {
  id: 'showtime-1',
  hallId: 'hall-1',
  startTime: new Date('2025-01-15T14:30:00Z'),
  endTime: new Date('2025-01-15T16:30:00Z'),
  status: ShowtimeStatusEnum.SELLING,
};

const mockShowtimeSeatResponse: ShowtimeSeatResponse = {
  showtime: {
    id: 'showtime-1',
    start_time: new Date('2025-01-15T14:30:00Z'),
    end_time: new Date('2025-01-15T16:30:00Z'),
    dateType: DayTypeEnum.WEEKDAY,
    timeSlot: TimeSlotEnum.AFTERNOON,
    format: FormatEnum.TWO_D,
    language: 'en',
    subtitles: ['vi'],
  },
  seat_map: [
    {
      row: 'A',
      seats: [
        {
          id: 'seat-1',
          number: 1,
          seatType: SeatTypeEnum.STANDARD,
          seatStatus: SeatStatusEnum.ACTIVE,
          reservationStatus: ReservationStatusEnum.AVAILABLE,
          isHeldByCurrentUser: false,
        },
        {
          id: 'seat-2',
          number: 2,
          seatType: SeatTypeEnum.VIP,
          seatStatus: SeatStatusEnum.ACTIVE,
          reservationStatus: ReservationStatusEnum.HELD,
          isHeldByCurrentUser: true,
        },
      ],
    },
  ],
  ticketTypes: Object.values(TicketTypeEnum),
  ticketPrices: [
    {
      seatType: SeatTypeEnum.STANDARD,
      ticketType: TicketTypeEnum.ADULT,
      price: 120000,
    },
    {
      seatType: SeatTypeEnum.VIP,
      ticketType: TicketTypeEnum.ADULT,
      price: 180000,
    },
  ],
  rules: {
    max_selectable: 8,
    hold_time_seconds: 300,
  },
};

describe('ShowtimeController', () => {
  let controller: ShowtimeController;
  let mockShowtimeService: jest.Mocked<ShowtimeService>;

  beforeEach(async () => {
    // Create mocked service
    mockShowtimeService = {
      getMovieShowtimesAtCinema: jest.fn(),
      getShowtimeSeats: jest.fn(),
      clearShowtimeCache: jest.fn(),
    } as unknown as jest.Mocked<ShowtimeService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShowtimeController],
      providers: [{ provide: ShowtimeService, useValue: mockShowtimeService }],
    }).compile();

    controller = module.get<ShowtimeController>(ShowtimeController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMovieShowtimesAtCinema', () => {
    const mockPayload = {
      cinemaId: 'cinema-1',
      movieId: 'movie-1',
      query: { date: '2025-01-15' } as GetShowtimesQuery,
    };

    it('should return showtime summary list from service', async () => {
      const expectedResponse = [mockShowtimeSummaryResponse];
      mockShowtimeService.getMovieShowtimesAtCinema.mockResolvedValue(
        expectedResponse
      );

      const result = await controller.getMovieShowtimesAtCinema(mockPayload);

      expect(result).toEqual(expectedResponse);
      expect(
        mockShowtimeService.getMovieShowtimesAtCinema
      ).toHaveBeenCalledWith(
        mockPayload.cinemaId,
        mockPayload.movieId,
        mockPayload.query
      );
      expect(
        mockShowtimeService.getMovieShowtimesAtCinema
      ).toHaveBeenCalledTimes(1);
    });

    it('should handle empty showtimes from service', async () => {
      mockShowtimeService.getMovieShowtimesAtCinema.mockResolvedValue([]);

      const result = await controller.getMovieShowtimesAtCinema(mockPayload);

      expect(result).toEqual([]);
      expect(
        mockShowtimeService.getMovieShowtimesAtCinema
      ).toHaveBeenCalledWith(
        mockPayload.cinemaId,
        mockPayload.movieId,
        mockPayload.query
      );
    });

    it('should handle multiple showtimes from service', async () => {
      const multipleShowtimes = [
        mockShowtimeSummaryResponse,
        {
          ...mockShowtimeSummaryResponse,
          id: 'showtime-2',
          startTime: new Date('2025-01-15T16:45:00Z'),
          endTime: new Date('2025-01-15T18:45:00Z'),
        },
        {
          ...mockShowtimeSummaryResponse,
          id: 'showtime-3',
          startTime: new Date('2025-01-15T19:00:00Z'),
          endTime: new Date('2025-01-15T21:00:00Z'),
        },
      ];
      mockShowtimeService.getMovieShowtimesAtCinema.mockResolvedValue(
        multipleShowtimes
      );

      const result = await controller.getMovieShowtimesAtCinema(mockPayload);

      expect(result).toEqual(multipleShowtimes);
      expect(result).toHaveLength(3);
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('Service unavailable');
      mockShowtimeService.getMovieShowtimesAtCinema.mockRejectedValue(
        serviceError
      );

      await expect(
        controller.getMovieShowtimesAtCinema(mockPayload)
      ).rejects.toThrow('Service unavailable');

      expect(
        mockShowtimeService.getMovieShowtimesAtCinema
      ).toHaveBeenCalledWith(
        mockPayload.cinemaId,
        mockPayload.movieId,
        mockPayload.query
      );
    });

    it('should handle different date formats in query', async () => {
      const payloadWithDifferentDate = {
        ...mockPayload,
        query: { date: '2025-12-31' } as GetShowtimesQuery,
      };
      mockShowtimeService.getMovieShowtimesAtCinema.mockResolvedValue([]);

      const result = await controller.getMovieShowtimesAtCinema(
        payloadWithDifferentDate
      );

      expect(result).toEqual([]);
      expect(
        mockShowtimeService.getMovieShowtimesAtCinema
      ).toHaveBeenCalledWith(
        payloadWithDifferentDate.cinemaId,
        payloadWithDifferentDate.movieId,
        payloadWithDifferentDate.query
      );
    });

    it('should handle various cinema and movie IDs', async () => {
      const payloadsToTest = [
        {
          cinemaId: 'cinema-123',
          movieId: 'movie-456',
          query: { date: '2025-01-15' },
        },
        {
          cinemaId: 'cinema-abc',
          movieId: 'movie-xyz',
          query: { date: '2025-02-20' },
        },
        {
          cinemaId: 'cinema-test',
          movieId: 'movie-test',
          query: { date: '2025-03-10' },
        },
      ];

      for (const payload of payloadsToTest) {
        mockShowtimeService.getMovieShowtimesAtCinema.mockResolvedValue([
          mockShowtimeSummaryResponse,
        ]);

        const result = await controller.getMovieShowtimesAtCinema(payload);

        expect(result).toEqual([mockShowtimeSummaryResponse]);
        expect(
          mockShowtimeService.getMovieShowtimesAtCinema
        ).toHaveBeenCalledWith(
          payload.cinemaId,
          payload.movieId,
          payload.query
        );
      }
    });

    it('should handle async service calls correctly', async () => {
      // Test that the controller properly waits for the service promise
      let resolveService: (value: ShowtimeSummaryResponse[]) => void;
      const servicePromise = new Promise<ShowtimeSummaryResponse[]>(
        (resolve) => {
          resolveService = resolve;
        }
      );

      mockShowtimeService.getMovieShowtimesAtCinema.mockReturnValue(
        servicePromise
      );

      const controllerPromise =
        controller.getMovieShowtimesAtCinema(mockPayload);

      // Resolve the service promise after a delay
      setTimeout(() => resolveService([mockShowtimeSummaryResponse]), 100);

      const result = await controllerPromise;
      expect(result).toEqual([mockShowtimeSummaryResponse]);
    });
  });

  describe('getShowtimeSeats', () => {
    const showtimeId = 'showtime-1';

    it('should return showtime seat information with user ID', async () => {
      const mockPayload = { showtimeId, userId: 'user-123' };
      mockShowtimeService.getShowtimeSeats.mockResolvedValue(
        mockShowtimeSeatResponse
      );

      const result = await controller.getShowtimeSeats(mockPayload);

      expect(result).toEqual(mockShowtimeSeatResponse);
      expect(mockShowtimeService.getShowtimeSeats).toHaveBeenCalledWith(
        showtimeId,
        'user-123'
      );
      expect(mockShowtimeService.getShowtimeSeats).toHaveBeenCalledTimes(1);
    });

    it('should return showtime seat information without user ID', async () => {
      const mockPayload = { showtimeId };
      mockShowtimeService.getShowtimeSeats.mockResolvedValue(
        mockShowtimeSeatResponse
      );

      const result = await controller.getShowtimeSeats(mockPayload);

      expect(result).toEqual(mockShowtimeSeatResponse);
      expect(mockShowtimeService.getShowtimeSeats).toHaveBeenCalledWith(
        showtimeId,
        undefined
      );
    });

    it('should handle optional userId parameter correctly', async () => {
      // Test with undefined userId
      const payloadWithoutUser = { showtimeId };
      mockShowtimeService.getShowtimeSeats.mockResolvedValue(
        mockShowtimeSeatResponse
      );

      let result = await controller.getShowtimeSeats(payloadWithoutUser);
      expect(result).toEqual(mockShowtimeSeatResponse);
      expect(mockShowtimeService.getShowtimeSeats).toHaveBeenCalledWith(
        showtimeId,
        undefined
      );

      // Reset mock
      mockShowtimeService.getShowtimeSeats.mockClear();

      // Test with null userId
      const payloadWithNullUser = { showtimeId, userId: null };
      result = await controller.getShowtimeSeats(payloadWithNullUser);
      expect(result).toEqual(mockShowtimeSeatResponse);
      expect(mockShowtimeService.getShowtimeSeats).toHaveBeenCalledWith(
        showtimeId,
        null
      );
    });

    it('should propagate service errors', async () => {
      const mockPayload = { showtimeId, userId: 'user-123' };
      const serviceError = new Error('Showtime not found');
      mockShowtimeService.getShowtimeSeats.mockRejectedValue(serviceError);

      await expect(controller.getShowtimeSeats(mockPayload)).rejects.toThrow(
        'Showtime not found'
      );

      expect(mockShowtimeService.getShowtimeSeats).toHaveBeenCalledWith(
        showtimeId,
        'user-123'
      );
    });

    it('should handle different showtime IDs', async () => {
      const showtimeIds = ['showtime-1', 'showtime-abc', 'showtime-xyz123'];

      for (const id of showtimeIds) {
        const payload = { showtimeId: id, userId: 'user-123' };
        mockShowtimeService.getShowtimeSeats.mockResolvedValue(
          mockShowtimeSeatResponse
        );

        const result = await controller.getShowtimeSeats(payload);

        expect(result).toEqual(mockShowtimeSeatResponse);
        expect(mockShowtimeService.getShowtimeSeats).toHaveBeenCalledWith(
          id,
          'user-123'
        );
      }
    });

    it('should handle different user IDs', async () => {
      const userIds = ['user-123', 'user-abc', 'user-xyz789', null, undefined];

      for (const userId of userIds) {
        const payload = { showtimeId, userId };
        mockShowtimeService.getShowtimeSeats.mockResolvedValue(
          mockShowtimeSeatResponse
        );

        const result = await controller.getShowtimeSeats(payload);

        expect(result).toEqual(mockShowtimeSeatResponse);
        expect(mockShowtimeService.getShowtimeSeats).toHaveBeenCalledWith(
          showtimeId,
          userId
        );
      }
    });

    it('should handle complex seat response structure', async () => {
      const complexSeatResponse: ShowtimeSeatResponse = {
        ...mockShowtimeSeatResponse,
        seat_map: [
          {
            row: 'A',
            seats: Array.from({ length: 10 }, (_, i) => ({
              id: `seat-a-${i + 1}`,
              number: i + 1,
              seatType: i % 2 === 0 ? SeatTypeEnum.STANDARD : SeatTypeEnum.VIP,
              seatStatus: SeatStatusEnum.ACTIVE,
              reservationStatus: ReservationStatusEnum.AVAILABLE,
              isHeldByCurrentUser: false,
            })),
          },
          {
            row: 'B',
            seats: Array.from({ length: 10 }, (_, i) => ({
              id: `seat-b-${i + 1}`,
              number: i + 1,
              seatType: SeatTypeEnum.PREMIUM,
              seatStatus:
                i === 5 ? SeatStatusEnum.MAINTENANCE : SeatStatusEnum.ACTIVE,
              reservationStatus:
                i < 3
                  ? ReservationStatusEnum.CONFIRMED
                  : ReservationStatusEnum.AVAILABLE,
              isHeldByCurrentUser: i === 7,
            })),
          },
        ],
      };

      const mockPayload = { showtimeId, userId: 'user-123' };
      mockShowtimeService.getShowtimeSeats.mockResolvedValue(
        complexSeatResponse
      );

      const result = await controller.getShowtimeSeats(mockPayload);

      expect(result).toEqual(complexSeatResponse);
      expect(result.seat_map).toHaveLength(2);
      expect(result.seat_map[0].seats).toHaveLength(10);
      expect(result.seat_map[1].seats).toHaveLength(10);
    });

    it('should handle async service calls correctly', async () => {
      const mockPayload = { showtimeId, userId: 'user-123' };

      // Test that the controller properly waits for the service promise
      let resolveService: (value: ShowtimeSeatResponse) => void;
      const servicePromise = new Promise<ShowtimeSeatResponse>((resolve) => {
        resolveService = resolve;
      });

      mockShowtimeService.getShowtimeSeats.mockReturnValue(servicePromise);

      const controllerPromise = controller.getShowtimeSeats(mockPayload);

      // Resolve the service promise after a delay
      setTimeout(() => resolveService(mockShowtimeSeatResponse), 100);

      const result = await controllerPromise;
      expect(result).toEqual(mockShowtimeSeatResponse);
    });

    it('should handle service timeout errors', async () => {
      const mockPayload = { showtimeId, userId: 'user-123' };
      const timeoutError = new Error('Service timeout');
      mockShowtimeService.getShowtimeSeats.mockRejectedValue(timeoutError);

      await expect(controller.getShowtimeSeats(mockPayload)).rejects.toThrow(
        'Service timeout'
      );
    });
  });

  describe('error handling', () => {
    it('should handle service unavailable errors', async () => {
      const unavailableError = new Error('Service unavailable');

      mockShowtimeService.getMovieShowtimesAtCinema.mockRejectedValue(
        unavailableError
      );
      mockShowtimeService.getShowtimeSeats.mockRejectedValue(unavailableError);

      const showtimePayload = {
        cinemaId: 'cinema-1',
        movieId: 'movie-1',
        query: { date: '2025-01-15' } as GetShowtimesQuery,
      };
      const seatPayload = { showtimeId: 'showtime-1', userId: 'user-123' };

      await expect(
        controller.getMovieShowtimesAtCinema(showtimePayload)
      ).rejects.toThrow('Service unavailable');

      await expect(controller.getShowtimeSeats(seatPayload)).rejects.toThrow(
        'Service unavailable'
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');

      mockShowtimeService.getMovieShowtimesAtCinema.mockRejectedValue(
        networkError
      );
      mockShowtimeService.getShowtimeSeats.mockRejectedValue(networkError);

      const showtimePayload = {
        cinemaId: 'cinema-1',
        movieId: 'movie-1',
        query: { date: '2025-01-15' } as GetShowtimesQuery,
      };
      const seatPayload = { showtimeId: 'showtime-1' };

      await expect(
        controller.getMovieShowtimesAtCinema(showtimePayload)
      ).rejects.toThrow('Network error');

      await expect(controller.getShowtimeSeats(seatPayload)).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle validation errors from service layer', async () => {
      const validationError = new Error('Invalid date format');
      mockShowtimeService.getMovieShowtimesAtCinema.mockRejectedValue(
        validationError
      );

      const invalidPayload = {
        cinemaId: 'cinema-1',
        movieId: 'movie-1',
        query: { date: 'invalid-date' } as GetShowtimesQuery,
      };

      await expect(
        controller.getMovieShowtimesAtCinema(invalidPayload)
      ).rejects.toThrow('Invalid date format');
    });
  });

  describe('concurrent requests', () => {
    it('should handle multiple concurrent showtime requests', async () => {
      const payload1 = {
        cinemaId: 'cinema-1',
        movieId: 'movie-1',
        query: { date: '2025-01-15' } as GetShowtimesQuery,
      };
      const payload2 = {
        cinemaId: 'cinema-2',
        movieId: 'movie-2',
        query: { date: '2025-01-16' } as GetShowtimesQuery,
      };
      const payload3 = {
        cinemaId: 'cinema-3',
        movieId: 'movie-3',
        query: { date: '2025-01-17' } as GetShowtimesQuery,
      };

      mockShowtimeService.getMovieShowtimesAtCinema.mockResolvedValue([
        mockShowtimeSummaryResponse,
      ]);

      const promises = [
        controller.getMovieShowtimesAtCinema(payload1),
        controller.getMovieShowtimesAtCinema(payload2),
        controller.getMovieShowtimesAtCinema(payload3),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results.every((result) => result.length === 1)).toBe(true);
      expect(
        mockShowtimeService.getMovieShowtimesAtCinema
      ).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple concurrent seat requests', async () => {
      const payloads = [
        { showtimeId: 'showtime-1', userId: 'user-1' },
        { showtimeId: 'showtime-2', userId: 'user-2' },
        { showtimeId: 'showtime-3', userId: 'user-3' },
      ];

      mockShowtimeService.getShowtimeSeats.mockResolvedValue(
        mockShowtimeSeatResponse
      );

      const promises = payloads.map((payload) =>
        controller.getShowtimeSeats(payload)
      );
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(
        results.every((result) => result === mockShowtimeSeatResponse)
      ).toBe(true);
      expect(mockShowtimeService.getShowtimeSeats).toHaveBeenCalledTimes(3);
    });
  });

  describe('message pattern integration', () => {
    it('should be properly decorated with MessagePattern for getMovieShowtimesAtCinema', () => {
      // This test verifies that the method exists and can be called
      // The actual MessagePattern decorator testing would require integration tests
      expect(controller.getMovieShowtimesAtCinema).toBeDefined();
      expect(typeof controller.getMovieShowtimesAtCinema).toBe('function');
    });

    it('should be properly decorated with MessagePattern for getShowtimeSeats', () => {
      // This test verifies that the method exists and can be called
      // The actual MessagePattern decorator testing would require integration tests
      expect(controller.getShowtimeSeats).toBeDefined();
      expect(typeof controller.getShowtimeSeats).toBe('function');
    });

    it('should handle payload structure correctly', async () => {
      // Test that the controller accepts the expected payload structure
      const showtimePayload = {
        cinemaId: 'cinema-1',
        movieId: 'movie-1',
        query: { date: '2025-01-15' } as GetShowtimesQuery,
      };

      const seatPayload = {
        showtimeId: 'showtime-1',
        userId: 'user-123',
      };

      mockShowtimeService.getMovieShowtimesAtCinema.mockResolvedValue([]);
      mockShowtimeService.getShowtimeSeats.mockResolvedValue(
        mockShowtimeSeatResponse
      );

      // These should not throw any errors related to payload structure
      await controller.getMovieShowtimesAtCinema(showtimePayload);
      await controller.getShowtimeSeats(seatPayload);

      expect(
        mockShowtimeService.getMovieShowtimesAtCinema
      ).toHaveBeenCalledWith(
        showtimePayload.cinemaId,
        showtimePayload.movieId,
        showtimePayload.query
      );
      expect(mockShowtimeService.getShowtimeSeats).toHaveBeenCalledWith(
        seatPayload.showtimeId,
        seatPayload.userId
      );
    });
  });
});
