import api from './api-client';
// import { useAuth } from '@clerk/nextjs';

// Types based on api-gateway responses and @movie-hub/shared-types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Admin API client with auth token support
export const createAdminApi = (getToken: () => Promise<string | null>) => {
  const authApi = {
    get: async <T>(url: string) => {
      const token = await getToken();
      const response = await api.get<ApiResponse<T>>(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    },
    post: async <T>(url: string, data?: unknown) => {
      const token = await getToken();
      const response = await api.post<ApiResponse<T>>(url, data, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    },
    put: async <T>(url: string, data?: unknown) => {
      const token = await getToken();
      const response = await api.put<ApiResponse<T>>(url, data, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    },
    patch: async <T>(url: string, data?: unknown) => {
      const token = await getToken();
      const response = await api.patch<ApiResponse<T>>(url, data, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    },
    delete: async <T>(url: string) => {
      const token = await getToken();
      const response = await api.delete<ApiResponse<T>>(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    },
  };

  return {
    // Cinema endpoints
    cinemas: {
      getAll: () => authApi.get<Cinema[]>('/cinemas'),
      getById: (id: string) => authApi.get<Cinema>(`/cinemas/${id}`),
      create: (data: CreateCinemaRequest) => authApi.post<Cinema>('/cinemas/cinema', data),
      update: (id: string, data: UpdateCinemaRequest) => authApi.patch<Cinema>(`/cinemas/cinema/${id}`, data),
      delete: (id: string) => authApi.delete<void>(`/cinemas/cinema/${id}`),
    },

    // Hall endpoints
    halls: {
      getById: (id: string) => authApi.get<Hall>(`/halls/hall/${id}`),
      getByCinema: (cinemaId: string) => authApi.get<Hall[]>(`/halls/cinema/${cinemaId}`),
      create: (data: CreateHallRequest) => authApi.post<Hall>('/halls/hall', data),
      update: (id: string, data: UpdateHallRequest) => authApi.patch<Hall>(`/halls/hall/${id}`, data),
      delete: (id: string) => authApi.delete<void>(`/halls/hall/${id}`),
      updateSeatStatus: (seatId: string, status: string) => 
        authApi.patch<void>(`/halls/seat/${seatId}/status`, { status }),
    },

    // Showtime endpoints
    showtimes: {
      getAll: (query?: ShowtimeQuery) => {
        const params = new URLSearchParams();
        if (query?.date) params.append('date', query.date);
        if (query?.cinemaId) params.append('cinemaId', query.cinemaId);
        if (query?.movieId) params.append('movieId', query.movieId);
        const queryStr = params.toString();
        return authApi.get<Showtime[]>(`/showtimes${queryStr ? `?${queryStr}` : ''}`);
      },
      getSeats: (showtimeId: string) => authApi.get<ShowtimeSeat[]>(`/showtimes/${showtimeId}/seats`),
      create: (data: CreateShowtimeRequest) => authApi.post<Showtime>('/showtimes/showtime', data),
      createBatch: (data: BatchCreateShowtimesInput) => authApi.post<BatchCreateShowtimesResponse>('/showtimes/batch', data),
      update: (id: string, data: UpdateShowtimeRequest) => authApi.patch<Showtime>(`/showtimes/showtime/${id}`, data),
      delete: (id: string) => authApi.delete<void>(`/showtimes/showtime/${id}`),
    },

    // Movie endpoints
    movies: {
      getAll: (query?: MovieQuery) => {
        const params = new URLSearchParams();
        if (query?.status) params.append('status', query.status);
        if (query?.page) params.append('page', query.page.toString());
        if (query?.limit) params.append('limit', query.limit.toString());
        const queryStr = params.toString();
        return authApi.get<Movie[]>(`/movies${queryStr ? `?${queryStr}` : ''}`);
      },
      getById: (id: string) => authApi.get<MovieDetail>(`/movies/${id}`),
      getReleases: (movieId: string) => authApi.get<MovieRelease[]>(`/movies/${movieId}/releases`),
      create: (data: CreateMovieRequest) => authApi.post<Movie>('/movies', data),
      update: (id: string, data: UpdateMovieRequest) => authApi.put<Movie>(`/movies/${id}`, data),
      delete: (id: string) => authApi.delete<void>(`/movies/${id}`),
    },

    // Genre endpoints
    genres: {
      getAll: () => authApi.get<Genre[]>('/genres'),
      getById: (id: string) => authApi.get<Genre>(`/genres/${id}`),
      create: (data: GenreRequest) => authApi.post<Genre>('/genres', data),
      update: (id: string, data: GenreRequest) => authApi.put<Genre>(`/genres/${id}`, data),
      delete: (id: string) => authApi.delete<void>(`/genres/${id}`),
    },

    // Movie Release endpoints
    movieReleases: {
      create: (data: CreateMovieReleaseRequest) => authApi.post<MovieRelease>('/movie-releases', data),
      update: (id: string, data: CreateMovieReleaseRequest) => authApi.put<MovieRelease>(`/movie-releases/${id}`, data),
      delete: (id: string) => authApi.delete<void>(`/movie-releases/${id}`),
    },

    // Ticket Pricing endpoints
    ticketPricing: {
      getByHall: (hallId: string) => authApi.get<TicketPricing[]>(`/ticket-pricings/hall/${hallId}`),
      update: (pricingId: string, price: number) => authApi.patch<TicketPricing>(`/ticket-pricings/pricing/${pricingId}`, { price }),
    },
  };
};

// Custom hook for using admin API
// DEPRECATED: Use new hooks from libs/api instead
// export const useAdminApi = () => {
//   const { getToken } = useAuth();
//   return createAdminApi(getToken);
// };

// Types for admin API
export type CinemaStatus = 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';
export type HallType = 'STANDARD' | 'PREMIUM' | 'IMAX' | 'FOUR_DX';
export type HallStatus = 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';
export type LayoutType = 'STANDARD' | 'DUAL_AISLE' | 'STADIUM';
export type SeatType = 'STANDARD' | 'VIP' | 'COUPLE' | 'PREMIUM' | 'WHEELCHAIR';
export type ShowtimeStatus = 'SELLING' | 'STOPPED' | 'CANCELLED';
export type ShowtimeFormat = 'TWO_D' | 'THREE_D' | 'IMAX' | 'FOUR_DX';
export type DayType = 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY';
export type AgeRating = 'P' | 'K' | 'T13' | 'T16' | 'T18' | 'C';
export type LanguageType = 'ORIGINAL' | 'SUBTITLE' | 'DUBBED';

// Thay thế `any` bằng kiểu Object cụ thể hơn
type GenericObject = Record<string, unknown>;

export interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  amenities: string[];
  facilities?: GenericObject;
  images: string[];
  virtualTour360Url?: string;
  rating?: number;
  totalReviews: number;
  operatingHours?: GenericObject;
  socialMedia?: GenericObject;
  status: CinemaStatus;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCinemaRequest {
  name: string;
  address: string;
  city: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  amenities?: string[];
  facilities?: GenericObject;
  images?: string[];
  virtualTour360Url?: string;
  operatingHours?: GenericObject;
  socialMedia?: GenericObject;
  timezone: string;
}

export type UpdateCinemaRequest = Partial<CreateCinemaRequest>;

export interface Hall {
  id: string;
  cinemaId: string;
  name: string;
  type: HallType;
  capacity: number;
  rows: number;
  screenType?: string;
  soundSystem?: string;
  features: string[];
  layoutType?: LayoutType;
  status: HallStatus;
  createdAt: string;
  updatedAt: string;
  seats?: Seat[];
}

export interface CreateHallRequest {
  cinemaId: string;
  name: string;
  type: HallType;
  screenType?: string;
  soundSystem?: string;
  features?: string[];
  layoutType?: LayoutType;
}

export interface UpdateHallRequest {
  name?: string;
  type?: HallType;
  screenType?: string;
  soundSystem?: string;
  features?: string[];
}

export interface UpdateSeatStatusRequest {
  status: string;
}

export interface Genre {
  id: string;
  name: string;
}

export interface GenreRequest {
  name: string;
}

export interface MovieCast {
  name: string;
  profileUrl?: string;
}

export interface Movie {
  id: string;
  title: string;
  posterUrl: string;
  backdropUrl?: string;
  runtime: number;
  ageRating: AgeRating;
  productionCountry: string;
  languageType: LanguageType;
}

export interface MovieDetail extends Movie {
  originalTitle?: string;
  overview: string;
  cast: MovieCast[];
  trailerUrl?: string;
  originalLanguage: string;
  spokenLanguages: string[];
  genre: Genre[];
  releaseDate: string;
  director?: string;
}

export interface CreateMovieRequest {
  title: string;
  overview: string;
  originalTitle?: string;
  posterUrl: string;
  trailerUrl?: string;
  backdropUrl?: string;
  runtime: number;
  releaseDate: string;
  ageRating: AgeRating;
  originalLanguage: string;
  spokenLanguages: string[];
  languageType: LanguageType;
  productionCountry: string;
  director?: string;
  cast: MovieCast[];
  genreIds: string[];
}

export type UpdateMovieRequest = Partial<CreateMovieRequest>;

export interface MovieQuery {
  status?: 'now_showing' | 'upcoming';
  page?: number;
  limit?: number;
}

export interface ShowtimeQuery {
  date?: string;
  cinemaId?: string;
  movieId?: string;
}

export interface MovieRelease {
  id: string;
  movieId: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED';
  note?: string;
}

export interface CreateMovieReleaseRequest {
  movieId: string;
  startDate: string;
  endDate: string;
  note?: string;
}

export interface Showtime {
  id: string;
  movieId: string;
  movieReleaseId: string;
  cinemaId: string;
  hallId: string;
  startTime: string;
  endTime: string;
  format: ShowtimeFormat;
  language: string;
  subtitles: string[];
  availableSeats: number;
  totalSeats: number;
  status: ShowtimeStatus;
  dayType: DayType;
  createdAt: string;
  updatedAt: string;
  // Nested relations
  hall?: Hall;
  movieRelease?: {
    id: string;
    movieId: string;
    startDate: string;
    endDate: string;
    movie?: Movie;
  };
}

export interface CreateShowtimeRequest {
  movieId: string;
  movieReleaseId: string;
  cinemaId: string;
  hallId: string;
  startTime: string;
  format: ShowtimeFormat;
  language: string;
  subtitles: string[];
}

export interface UpdateShowtimeRequest {
  movieId?: string;
  movieReleaseId?: string;
  cinemaId?: string;
  hallId?: string;
  startTime?: string;
  format?: ShowtimeFormat;
  language?: string;
  subtitles?: string[];
}

export interface BatchCreateShowtimesInput {
  movieReleaseId: string;
  cinemaId: string;
  hallId: string;
  format: ShowtimeFormat;
  language: string;
  subtitles: string[];
  times: string[]; // Array of start times
  dates: string[]; // Array of dates
}

export interface BatchCreateShowtimesResponse {
  created: number;
  failed: number;
  errors?: string[];
}

export interface Seat {
  id: string;
  hallId: string;
  row: string;
  number: number;
  type: SeatType;
  status: 'ACTIVE' | 'MAINTENANCE' | 'BROKEN';
}

export interface ShowtimeSeat {
  id: string;
  seatId: string;
  showtimeId: string;
  status: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'LOCKED';
  seat?: Seat;
}

export interface TicketPricing {
  id: string;
  hallId: string;
  seatType: string;
  dayType: string;
  format: string;
  price: number;
}
