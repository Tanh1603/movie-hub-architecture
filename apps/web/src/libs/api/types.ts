// ============================================================================
// SHARED TYPES - Based on Backend API Responses
// ============================================================================
// Import enums from shared-types monorepo library
// Import directly from enum files to avoid NestJS dependencies
import {
  Gender,
  StaffStatus,
  WorkType,
  StaffPosition,
  ShiftType,
} from '@movie-hub/shared-types/user/enum';

import {
  AgeRatingEnum,
  LanguageOptionEnum,
} from '@movie-hub/shared-types/movie/enum';

import {
  HallTypeEnum,
  LayoutTypeEnum,
  SeatTypeEnum,
  DayTypeEnum,
  SeatStatusEnum,
  FormatEnum,
  ShowtimeStatusEnum,
  CinemaStatusEnum,
} from '@movie-hub/shared-types/cinema/enum';

import {
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  RefundStatus,
  TicketStatus,
  ConcessionCategory,
  PromotionType,
  LoyaltyTransactionType,
  LoyaltyTier,
} from '@movie-hub/shared-types/booking/enum';

// Re-export with aliases for consistency
export { Gender, StaffStatus, WorkType, StaffPosition, ShiftType };

export type AgeRating = AgeRatingEnum | string;
export type LanguageType = LanguageOptionEnum | string;
export type HallType = HallTypeEnum | string;
export type LayoutType = LayoutTypeEnum | string;
export type SeatType = SeatTypeEnum | string;
export type DayType = DayTypeEnum | string;
export type SeatStatus = SeatStatusEnum | string;
export type ShowtimeFormat = FormatEnum | string;
export type ShowtimeStatus = ShowtimeStatusEnum | string;
export type CinemaStatus = CinemaStatusEnum | string;

export type {
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  RefundStatus,
  TicketStatus,
  ConcessionCategory,
  PromotionType,
  LoyaltyTransactionType,
  LoyaltyTier,
};

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string | Date;
  validTo: string | Date;
  usageLimit?: number;
  usagePerUser?: number;
  currentUsage: number;
  applicableFor?: string[];
  conditions?: Record<string, unknown>;
  active: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreatePromotionRequest {
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string | Date;
  validTo: string | Date;
  usageLimit?: number;
  usagePerUser?: number;
  applicableFor?: string[];
  conditions?: Record<string, unknown>;
  active?: boolean;
}

export type UpdatePromotionRequest = Partial<CreatePromotionRequest>;

export interface PromotionFiltersParams {
  active?: boolean | string;
  type?: PromotionType;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  refundedAt?: string | Date;
  createdAt: string | Date;
}

// ============================================================================
// CUSTOM INTERFACES
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface MovieCast {
  name: string;
  profileUrl?: string;
  character?: string;
}

export interface Movie {
  id: string;
  title: string;
  originalTitle?: string;
  overview?: string;
  runtime: number;
  releaseDate: string | Date;
  posterUrl: string;
  backdropUrl?: string;
  trailerUrl: string;
  originalLanguage: string;
  spokenLanguages?: string[];
  languageType?: LanguageType;
  productionCountry?: string;
  ageRating: AgeRating;
  director?: string;
  cast?: MovieCast[];
  genreIds?: string[];
  genre?: Genre[]; // Backend returns 'genre' (singular), array of Genre objects
  averageRating?: number;
  reviewCount?: number;
  status?: 'COMING_SOON' | 'NOW_SHOWING' | 'ENDED';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateMovieRequest {
  title: string;
  originalTitle: string;
  overview: string; // Backend uses 'overview'
  runtime: number; // Backend uses 'runtime'
  releaseDate: string | Date;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  originalLanguage: string;
  spokenLanguages: string[];
  languageType: LanguageType;
  productionCountry: string;
  ageRating: AgeRating;
  director: string;
  cast: MovieCast[]; // Backend expects array of objects
  genreIds: string[];
}

// Alias for admin panel compatibility
export type CreateMovieDto = CreateMovieRequest;

export type UpdateMovieRequest = Partial<CreateMovieRequest>;

export interface MoviesListParams extends PaginationParams {
  search?: string;
  genreIds?: string[];
  status?: 'COMING_SOON' | 'NOW_SHOWING' | 'ENDED';
  releaseYear?: number;
  ageRating?: AgeRating;
}

// ============================================================================
// GENRE TYPES (API 2.x)
// ============================================================================

export interface Genre {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGenreRequest {
  name: string;
}

export interface UpdateGenreRequest {
  name: string;
}

// ============================================================================
// CINEMA TYPES (API 3.x)
// ============================================================================

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
  amenities?: string[];
  facilities?: Record<string, unknown>;
  images?: string[];
  virtualTour360Url?: string;
  operatingHours?: Record<string, unknown>;
  socialMedia?: Record<string, unknown>;
  timezone?: string;
  status?: CinemaStatus;
  rating?: number;
  totalReviews?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateCinemaRequest {
  name: string;
  address: string;
  city: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number; // Flat structure to match backend
  longitude?: number; // Flat structure to match backend
  description?: string;
  amenities?: string[];
  facilities?: Record<string, unknown>;
  images?: string[];
  virtualTour360Url?: string;
  operatingHours?: Record<string, unknown>;
  socialMedia?: Record<string, unknown>;
  timezone?: string;
}

export type UpdateCinemaRequest = Partial<CreateCinemaRequest>;

export interface GetCinemasResponse {
  cinemas: Cinema[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CinemaFiltersParams extends PaginationParams {
  city?: string;
  district?: string;
  amenities?: string[];
}

// ============================================================================
// HALL TYPES (API 4.x & 5.x)
// ============================================================================

export interface Seat {
  id: string;
  rowLetter: string; // Backend uses rowLetter not rowLabel
  seatNumber: number;
  type: SeatType;
  status: SeatStatus;
}

export interface PhysicalSeatRow {
  row: string;
  seats: Seat[];
}

export interface Hall {
  id: string;
  cinemaId: string;
  cinema?: Cinema;
  name: string;
  type: HallType;
  capacity: number; // Calculated from seatMap
  rows: number; // Calculated from seatMap
  screenType?: string;
  soundSystem?: string;
  features?: string[];
  layoutType?: LayoutType;
  status?: string;
  seatMap?: PhysicalSeatRow[]; // Backend returns seatMap as array of rows
  createdAt?: string | Date;
  updatedAt?: string | Date;
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

export type UpdateHallRequest = Partial<Omit<CreateHallRequest, 'cinemaId'>>;

export interface UpdateSeatStatusRequest {
  status: SeatStatus;
}

export interface CinemasGroupedResponse {
  [cinemaId: string]: { cinema: Cinema; halls: Hall[] };
}

// ============================================================================
// SHOWTIME TYPES (API 5.x)
// ============================================================================

export interface Showtime {
  id: string;
  movieId: string;
  movieTitle?: string; // Backend provides this in list endpoint
  movie?: Movie;
  movieReleaseId?: string; // Backend list endpoint doesn't return this, only detail endpoint does
  cinemaId: string;
  cinemaName?: string; // Backend provides this
  cinema?: Cinema;
  hallId: string;
  hallName?: string; // Backend provides this
  hall?: Hall;
  startTime: string; // ISO datetime or 'yyyy-MM-dd HH:mm:ss'
  endTime?: string;
  format: ShowtimeFormat;
  language: string; // Backend uses string, not enum
  subtitles?: string[]; // Backend has subtitles field
  availableSeats?: number;
  totalSeats?: number; // Backend provides this
  status?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateShowtimeRequest {
  movieId: string;
  movieReleaseId: string; // Backend requires this
  cinemaId: string;
  hallId: string;
  startTime: string; // ISO datetime format (per OpenAPI date-time)
  format: ShowtimeFormat;
  language: string;
  subtitles?: string[];
}

export type UpdateShowtimeRequest = Partial<CreateShowtimeRequest>;

export interface ShowtimeFiltersParams {
  cinemaId?: string;
  movieId?: string;
  date?: string; // YYYY-MM-DD
  hallId?: string;
}

export interface BatchCreateShowtimesRequest {
  movieId: string;
  movieReleaseId: string; // Backend requires this
  cinemaId: string;
  hallId: string;
  startDate: string; // yyyy-MM-dd (unwrapped from dateRange)
  endDate: string; // yyyy-MM-dd (unwrapped from dateRange)
  timeSlots: string[]; // ["10:00", "14:30", "19:00"]
  repeatType: 'DAILY' | 'WEEKLY' | 'CUSTOM_WEEKDAYS';
  weekdays?: number[]; // [0-6] for CUSTOM_WEEKDAYS mode
  format: ShowtimeFormat;
  language: string;
  subtitles?: string[];
  excludeDates?: string[]; // Optional: Skip specific dates
}

// ============================================================================
// SHOWTIME SEAT TYPES
// ============================================================================

export interface ShowtimeSeat extends Seat {
  showtimeId: string;
  isReserved: boolean;
  isBooked: boolean;
  price?: number;
}

export interface SeatItemDto {
  id: string;
  number: number;
  seatType: SeatType;
  seatStatus: SeatStatus;
  reservationStatus: 'AVAILABLE' | 'HELD' | 'CONFIRMED' | 'CANCELLED';
  isHeldByCurrentUser?: boolean;
}

export interface SeatRowDto {
  row: string;
  seats: SeatItemDto[];
}

export interface ShowtimeInfoDto {
  id: string;
  movieId: string;
  movieTitle: string;
  start_time: string | Date;
  end_time: string | Date;
  dateType: DayType;
  format: ShowtimeFormat;
  language: string;
  subtitles: string[];
}

export interface TicketPricingDto {
  seatType: SeatType;
  price: number;
}

export interface ShowtimeSeatResponse {
  showtime: ShowtimeInfoDto;
  cinemaId: string;
  cinemaName: string;
  hallId: string;
  hallName: string;
  layoutType: string;
  seat_map: SeatRowDto[];
  ticketPrices: TicketPricingDto[];
  rules: {
    max_selectable: number;
    hold_time_seconds: number;
  };
}

// ============================================================================
// MOVIE RELEASE TYPES (API 6.x)
// ============================================================================

export interface MovieRelease {
  id: string;
  movieId: string;
  movie?: Movie;
  cinemaId?: string; // Backend might not always return this
  cinema?: Cinema;
  startDate: string | Date;
  endDate: string | Date;
  status?: 'UPCOMING' | 'ACTIVE' | 'ENDED'; // Calculated field, not in request
  note?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateMovieReleaseRequest {
  movieId: string; // REQUIRED - matching BE
  cinemaId?: string; // Backend schema doesn't have cinemaId in create request
  startDate: string | Date;
  endDate?: string | Date; // OPTIONAL - matching BE
  note?: string; // Optional per BE DTO
}

export type UpdateMovieReleaseRequest = Partial<CreateMovieReleaseRequest>;

export interface MovieReleasesListParams {
  cinemaId?: string;
  movieId?: string;
}

// ============================================================================
// TICKET PRICING TYPES (API 7.x)
// ============================================================================

export interface TicketPricing {
  id: string;
  hallId: string;
  hall?: Hall;
  seatType: SeatType;
  dayType: DayType; // Backend uses dayType (WEEKDAY/WEEKEND/HOLIDAY)
  price: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface UpdateTicketPricingRequest {
  price: number; // Backend only allows updating price
}

export interface TicketPricingFiltersParams {
  hallId?: string;
  seatType?: SeatType;
  dayType?: DayType;
}

// ============================================================================
// STAFF TYPES (API 8.x)
// ============================================================================

export interface Staff {
  id: string;
  cinemaId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: Gender | string;
  dob: string | Date;
  position: StaffPosition | string;
  status: StaffStatus | string;
  workType: WorkType | string;
  shiftType: ShiftType | string;
  salary: number;
  hireDate: string | Date;
}

export interface CreateStaffRequest {
  cinemaId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: Gender | string;
  dob: string | Date;
  position: StaffPosition | string;
  status: StaffStatus | string;
  workType: WorkType | string;
  shiftType: ShiftType | string;
  salary: number;
  hireDate: string | Date;
}

export interface CreateStaffResponse {
  id: string;
  cinemaId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: Gender;
  dob: string | Date;
  position: StaffPosition;
  status: StaffStatus;
  workType: WorkType;
  shiftType: ShiftType;
  salary: number;
  hireDate: string | Date;
  createdAt: string | Date;
}

export interface UpdateStaffRequest {
  fullName?: string;
  phone?: string;
  gender?: Gender | string;
  dob?: string | Date;
  position?: StaffPosition | string;
  status?: StaffStatus | string;
  workType?: WorkType | string;
  shiftType?: ShiftType | string;
  salary?: number;
  hireDate?: string | Date;
}

export interface UpdateStaffResponse {
  id: string;
  cinemaId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: Gender;
  dob: string | Date;
  position: StaffPosition;
  status: StaffStatus;
  workType: WorkType;
  shiftType: ShiftType;
  salary: number;
  hireDate: string | Date;
  updatedAt: string | Date;
}

export type GetStaffResponse = PaginatedResponse<Staff>;

export interface DeleteStaffResponse {
  success: boolean;
  message?: string;
}

export interface StaffFiltersParams extends PaginationParams {
  cinemaId?: string;
  fullName?: string;
  gender?: Gender;
  position?: StaffPosition;
  status?: StaffStatus;
  workType?: WorkType;
  shiftType?: ShiftType;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// ADMIN PANEL SPECIFIC TYPES
// ============================================================================

export type CreateCinemaDto = CreateCinemaRequest;
export type CreateHallDto = CreateHallRequest;
export type CreateMovieDtoRequest = CreateMovieRequest;
export type CreateShowtimeDto = CreateShowtimeRequest;
export type CreateStaffDto = CreateStaffRequest;
export type UpdateShowtimeDtoRequest = UpdateShowtimeRequest;
export type UpdateStaffDtoRequest = UpdateStaffRequest;

// Additional response DTOs for consistency
export type MovieResponse = Movie;
export type CinemaResponse = Cinema;
export type HallResponse = Hall;
export type ShowtimeResponse = Showtime;
export type StaffResponse = Staff;
export type MovieReleaseResponse = MovieRelease;
export type TicketPricingResponse = TicketPricing;

// ============================================================================
// BOOKING/RESERVATION TYPES (API 9.x - Admin)
// ============================================================================

export interface SeatInfo {
  seatId: string;
  row: string;
  number: number;
  seatType: string;
  ticketType: string;
  price: number;
}

export interface ConcessionInfo {
  concessionId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface BookingSummary {
  id: string;
  bookingCode: string;
  showtimeId: string;
  movieTitle: string;
  cinemaName: string;
  hallName: string;
  startTime: string | Date;
  seatCount: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string | Date;
}

export interface BookingDetail extends BookingSummary {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  seats: SeatInfo[];
  concessions?: ConcessionInfo[];
  subtotal: number;
  discount: number;
  pointsUsed: number;
  pointsDiscount: number;
  finalAmount: number;
  promotionCode?: string;
  paymentStatus: PaymentStatus;
  expiresAt?: string | Date;
  cancelledAt?: string | Date;
  cancellationReason?: string;
  updatedAt: string | Date;
}

export type GetBookingsResponse = PaginatedResponse<BookingSummary>;

export type GetBookingDetailResponse = BookingDetail;

export interface UpdateBookingStatusRequest {
  status: BookingStatus;
  reason?: string;
}

export interface UpdateBookingStatusResponse {
  id: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  updatedAt: string | Date;
}

export interface ConfirmBookingResponse {
  id: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  confirmedAt: string | Date;
}

export interface BookingFiltersParams extends PaginationParams {
  userId?: string;
  showtimeId?: string;
  cinemaId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string | Date;
  endDate?: string | Date;
  sortBy?: 'created_at' | 'final_amount' | 'expires_at';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// REVIEW TYPES (API 10.x)
// ============================================================================

export interface Review {
  id: string;
  movieId: string;
  userId: string;
  rating: number;
  content: string;
  createdAt: string | Date;
  title?: string;
  helpfulCount?: number;
  updatedAt?: string | Date;
  // BE doesn't return these, but FE can enrich them
  movieTitle?: string;
  userName?: string;
  userEmail?: string;
}

export type GetReviewsResponse = PaginatedResponse<Review>;

export interface DeleteReviewResponse {
  success: boolean;
  message?: string;
}

export interface ReviewFiltersParams extends PaginationParams {
  rating?: number;
  userId?: string;
  movieId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// STATS & REPORTS (Placeholder - APIs not implemented)
// ============================================================================

export interface DashboardStats {
  totalMovies: number;
  totalCinemas: number;
  totalHalls: number;
  totalShowtimes: number;
  recentBookings?: number;
  revenue?: number;
}

// ============================================================================
// CONCESSION TYPES (API Concessions)
// ============================================================================

export interface Concession {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  category: ConcessionCategory;
  price: number;
  imageUrl?: string;
  available: boolean;
  inventory?: number;
  cinemaId?: string;
  nutritionInfo?: Record<string, string | number | boolean>;
  allergens?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateConcessionRequest {
  name: string;
  nameEn?: string;
  description?: string;
  category: ConcessionCategory | string;
  price: number;
  imageUrl?: string;
  available?: boolean;
  inventory?: number;
  cinemaId?: string;
  nutritionInfo?: Record<string, string | number | boolean>;
  allergens?: string[];
}

export interface UpdateConcessionRequest {
  name?: string;
  nameEn?: string;
  description?: string;
  category?: ConcessionCategory | string;
  price?: number;
  imageUrl?: string;
  available?: boolean;
  inventory?: number;
  cinemaId?: string;
  nutritionInfo?: Record<string, string | number | boolean>;
  allergens?: string[];
}

export interface ConcessionFiltersParams {
  cinemaId?: string;
  category?: ConcessionCategory | string;
  available?: boolean;
}

// ============================================================================
// SYSTEM CONFIG TYPES (API Config)
// ============================================================================

export interface SystemConfig {
  key: string;
  value: any;
  description?: string;
  updatedAt?: string;
}

export interface UpdateSystemConfigRequest {
  key: string;
  value: any;
  description?: string;
}

// ============================================================================
// REVIEW REQUEST TYPES
// ============================================================================
export interface CreateReviewRequest {
  movieId: string;
  userId: string;
  rating: number;
  content: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  content?: string;
}
