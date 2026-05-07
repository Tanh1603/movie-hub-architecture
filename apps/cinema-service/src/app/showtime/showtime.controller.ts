import { Controller, Logger } from '@nestjs/common';
import { ShowtimeService } from './showtime.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
  AdminGetShowtimesQuery,
  BatchCreateShowtimesInput,
  CinemaMessage,
  CreateShowtimeRequest,
  GetShowtimesQuery,
  UpdateShowtimeRequest,
  SeatPricingWithTtlDto,
  AdminShowtimeFilterDTO,
} from '@movie-hub/shared-types';
import { ShowtimeCommandService } from './showtime-command.service';

@Controller('showtimes')
export class ShowtimeController {
  private readonly logger = new Logger(ShowtimeController.name);

  constructor(
    private readonly showtimeService: ShowtimeService,
    private readonly showtimeCommandService: ShowtimeCommandService
  ) {}

  @MessagePattern(CinemaMessage.SHOWTIME.FILTER_SHOWTIME)
  getShowtimes(@Payload() filter: AdminShowtimeFilterDTO) {
    return this.showtimeService.getShowtimes(filter);
  }

  @MessagePattern(CinemaMessage.SHOWTIME.GET_SHOWTIME)
  getShowtime(@Payload() showtimeId: string) {
    return this.showtimeService.getShowtimeById(showtimeId);
  }

  @MessagePattern(CinemaMessage.CINEMA.GET_SHOWTIME)
  getMovieShowtimesAtCinema(
    @Payload()
    payload: {
      cinemaId: string;
      movieId: string;
      query: GetShowtimesQuery;
    }
  ) {
    return this.showtimeService.getMovieShowtimesAtCinema(
      payload.cinemaId,
      payload.movieId,
      payload.query
    );
  }

  @MessagePattern(CinemaMessage.CINEMA.ADMIN_GET_SHOWTIME)
  adminGetMovieShowtimes(
    @Payload()
    payload: {
      cinemaId: string;
      movieId: string;
      query: AdminGetShowtimesQuery;
    }
  ) {
    return this.showtimeService.adminGetMovieShowtimes(
      payload.cinemaId,
      payload.movieId,
      payload.query
    );
  }

  @MessagePattern(CinemaMessage.SHOWTIME.GET_SHOWTIME_SEATS)
  getShowtimeSeats(
    @Payload() payload: { showtimeId: string; userId?: string }
  ) {
    return this.showtimeService.getShowtimeSeats(
      payload.showtimeId,
      payload.userId
    );
  }

  @MessagePattern(CinemaMessage.SHOWTIME.GET_SEATS_HELD_BY_USER)
  getSeatsHeldByUser(
    @Payload() payload: { showtimeId: string; userId: string }
  ): Promise<SeatPricingWithTtlDto> {
    return this.showtimeService.getSeatsHeldByUser(
      payload.showtimeId,
      payload.userId
    );
  }

  @MessagePattern(CinemaMessage.SHOWTIME.GET_SESSION_TTL)
  getSessionTTL(@Payload() payload: { showtimeId: string; userId: string }) {
    return this.showtimeService.getSessionTTL(
      payload.showtimeId,
      payload.userId
    );
  }

  @MessagePattern(CinemaMessage.SHOWTIME.GET_SHOWTIMES_BY_IDS)
  getShowtimesByIds(@Payload() payload: { showtimeIds: string[] }) {
    return this.showtimeService.getShowtimesByIds(payload.showtimeIds);
  }

  @MessagePattern(CinemaMessage.SHOWTIME.CREATE_SHOWTIME)
  createShowtime(@Payload() payload: CreateShowtimeRequest) {
    return this.showtimeCommandService.createShowtime(payload);
  }

  @MessagePattern(CinemaMessage.SHOWTIME.BATCH_CREATE_SHOWTIMES)
  batchCreateShowtimes(@Payload() payload: BatchCreateShowtimesInput) {
    return this.showtimeCommandService.batchCreateShowtimes(payload);
  }

  @MessagePattern(CinemaMessage.SHOWTIME.UPDATE_SHOWTIME)
  updateShowtime(
    @Payload()
    payload: {
      showtimeId: string;
      updateData: UpdateShowtimeRequest;
    }
  ) {
    return this.showtimeCommandService.updateShowtime(
      payload.showtimeId,
      payload.updateData
    );
  }

  @MessagePattern(CinemaMessage.SHOWTIME.DELETE_SHOWTIME)
  deleteShowtime(@Payload() payload: { showtimeId: string }) {
    return this.showtimeCommandService.cancelShowtime(payload.showtimeId);
  }

  // ===========================
  // EVENT HANDLERS (Fire-and-forget)
  // ===========================

  /**
   * Handle seat release event from booking service when a refund is processed.
   * This is a fire-and-forget event pattern - no response is expected.
   */
  @EventPattern(CinemaMessage.SHOWTIME.RELEASE_SEATS)
  async handleReleaseSeats(
    @Payload() payload: { showtimeId: string; seatIds: string[] }
  ) {
    this.logger.log(
      `Received seat release event for showtime ${payload.showtimeId}`
    );
    return this.showtimeCommandService.releaseSeats(payload);
  }
}
