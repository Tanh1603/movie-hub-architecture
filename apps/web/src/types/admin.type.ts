import type {
  Cinema,
  CreateCinemaRequest,
  CreateHallRequest,
  Hall,
} from './cinema.type';
import type {
  CreateMovieRequest,
  Movie,
  MovieRelease,
} from './movie.type';
import type {
  CreateShowtimeRequest,
  Showtime,
  UpdateShowtimeRequest,
} from './showtime.type';
import type {
  CreateStaffRequest,
  Staff,
  UpdateStaffRequest,
} from './staff.type';
import type { TicketPricing } from './ticket-pricing.type';

export type CreateCinemaDto = CreateCinemaRequest;
export type CreateHallDto = CreateHallRequest;
export type CreateMovieDtoRequest = CreateMovieRequest;
export type CreateShowtimeDto = CreateShowtimeRequest;
export type CreateStaffDto = CreateStaffRequest;
export type UpdateShowtimeDtoRequest = UpdateShowtimeRequest;
export type UpdateStaffDtoRequest = UpdateStaffRequest;

export type MovieResponse = Movie;
export type CinemaResponse = Cinema;
export type HallResponse = Hall;
export type ShowtimeResponse = Showtime;
export type StaffResponse = Staff;
export type MovieReleaseResponse = MovieRelease;
export type TicketPricingResponse = TicketPricing;
