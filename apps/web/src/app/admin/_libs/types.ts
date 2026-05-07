// Admin Types - Cinema Management System
// Import enums from shared-types
import {
  HallTypeEnum as HallType,
  LayoutTypeEnum as LayoutType,
  SeatTypeEnum as SeatType,
  SeatStatusEnum as SeatStatus,
  ShowtimeStatusEnum as ShowtimeStatus,
  FormatEnum as ShowtimeFormat,
  DayTypeEnum as DayType,
} from '@movie-hub/shared-types/cinema/enum';

import {
  AgeRatingEnum as AgeRating,
  LanguageOptionEnum,
} from '@movie-hub/shared-types/movie/enum';

import {
  Gender,
  StaffStatus,
  WorkType,
  StaffPosition,
  ShiftType,
} from '@movie-hub/shared-types/user/enum';

import {
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
} from '@movie-hub/shared-types/booking/enum';

// Re-export for convenience
export type {
  HallType,
  LayoutType,
  SeatType,
  SeatStatus,
  ShowtimeStatus,
  ShowtimeFormat,
  DayType,
  AgeRating,
  Gender,
  StaffStatus,
  WorkType,
  StaffPosition,
  ShiftType,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
};

export type LanguageType = LanguageOptionEnum;
export const LanguageType = LanguageOptionEnum;

export type CinemaStatus = 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';
export type HallStatus = 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';
export type MovieStatus = 'now_showing' | 'upcoming';

// Generic object type to replace any
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
  status: CinemaStatus | string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
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
  seatMap: PhysicalSeatRowDto[];
  createdAt: Date;
  updatedAt: Date;
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

export interface Genre {
  id: string;
  name: string;
}

export interface GenreResponse {
  id: string;
  name: string;
}

export interface MovieCast {
  name: string;
  character?: string;
  profileUrl?: string;
}

export interface MovieSummary {
  id: string;
  title: string;
  posterUrl: string;
  backdropUrl: string;
  runtime: number;
  ageRating: AgeRating;
  productionCountry: string;
  languageType: LanguageType;
  averageRating: number;
  reviewCount: number;
}

export interface Movie extends MovieSummary {
  originalTitle: string;
  overview: string;
  cast: unknown;
  trailerUrl: string;
  releaseDate: Date;
  originalLanguage: string;
  spokenLanguages: string[];
  director: string;
  genre: GenreResponse[];
}

export interface CreateMovieDto {
  title: string;
  overview: string;
  originalTitle: string;
  posterUrl: string;
  trailerUrl: string;
  backdropUrl: string;
  runtime: number;
  releaseDate: Date;
  ageRating: AgeRating;
  originalLanguage: string;
  spokenLanguages: string[];
  languageType: LanguageType;
  productionCountry: string;
  director: string;
  cast: MovieCast[];
  genreIds: string[];
}

export interface Showtime {
  id: string;
  movieId: string;
  movieReleaseId?: string;
  cinemaId: string;
  hallId: string;
  startTime: Date;
  endTime: Date;
  format: ShowtimeFormat;
  language: string;
  subtitles: string[];
  availableSeats: number;
  totalSeats: number;
  status: ShowtimeStatus;
  dayType: DayType;
  createdAt: Date;
  updatedAt: Date;
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

export interface Staff {
  id: string;
  cinemaId: string;
  fullName: string;
  email: string;
  phone: string;
  gender: Gender;
  dob: Date;
  position: StaffPosition;
  status: StaffStatus;
  workType: WorkType;
  shiftType: ShiftType;
  salary: number;
  hireDate: Date;
}

export interface MovieRelease {
  id: string;
  startDate: Date;
  endDate: Date;
  note: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Seat types
export type ShowtimeSeatStatus = 'AVAILABLE' | 'BOOKED' | 'RESERVED' | 'LOCKED';

export interface PhysicalSeatRowDto {
  row: string;
  seats: Seat[];
}

export interface Seat {
  id: string;
  hallId: string;
  row: string;
  number: number;
  type: SeatType;
  status: SeatStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShowtimeSeat {
  id: string;
  showtimeId: string;
  seatId: string;
  status: ShowtimeSeatStatus;
  price: number;
  seat?: Seat;
  createdAt: string;
  updatedAt: string;
}

export interface TicketPricing {
  id: string;
  hallId: string;
  seatType: SeatType;
  dayType: DayType;
  price: number;
}

// ============================================
// Batch Showtimes Types
// ============================================

export interface BatchCreateShowtimesInput {
  movieId: string;
  movieReleaseId: string;
  cinemaId: string;
  hallId: string;
  startDate: string;
  endDate: string;
  timeSlots: string[];
  repeatType: 'DAILY' | 'WEEKLY' | 'CUSTOM_WEEKDAYS';
  weekdays?: number[];
  format: string;
  language: string;
  subtitles: string[];
}

export interface BatchCreateResponse {
  createdCount: number;
  skippedCount: number;
  created: Array<{
    id: string;
    startTime: string;
  }>;
  skipped: Array<{
    start: string;
    reason: string;
  }>;
}

// ============================================
// Seat Status Types
// ============================================

export interface SeatDetail {
  id: string;
  row: number;
  seatNumber: number;
  type: SeatType;
  status: SeatStatus;
}

export interface HallDetail {
  id: string;
  name: string;
  type: string;
  capacity: number;
  rows: number;
  status: string;
  seats: SeatDetail[];
}

// ============================================
// Settings Types
// ============================================

export interface ProfileSettings {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  department: string;
  timezone: string;
  language: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  bookingAlerts: boolean;
  revenueReports: boolean;
  systemAlerts: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  loginNotifications: boolean;
  ipWhitelist: string[];
  lastPasswordChange: string;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  debugMode: boolean;
  apiRateLimit: number;
  maxUploadSize: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  backupFrequency: string;
  logRetention: number;
}

export interface BillingSettings {
  companyName: string;
  taxId: string;
  billingEmail: string;
  billingAddress: string;
  paymentMethod: string;
  autoRenewal: boolean;
  currentPlan: string;
  nextBillingDate: string;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animations: boolean;
  sidebarCollapsed: boolean;
}

// ============================================
// Showtime Seats Types
// ============================================

export type ReservationStatus =
  | 'AVAILABLE'
  | 'HELD'
  | 'RESERVED'
  | 'SOLD'
  | 'CONFIRMED'
  | 'CANCELLED';

export interface ShowtimeSeatDetail {
  id: string;
  number: number;
  seatType: SeatType;
  seatStatus: SeatStatus;
  reservationStatus: ReservationStatus;
  isHeldByCurrentUser: boolean | null;
}

export interface SeatRow {
  row: string;
  seats: ShowtimeSeatDetail[];
}

export interface ShowtimeInfo {
  id: string;
  movieId: string;
  movieTitle: string;
  start_time: string;
  end_time: string;
  dateType: DayType;
  format: string;
  language: string;
  subtitles: string[];
}

export interface TicketPrice {
  seatType: SeatType;
  price: number;
}

export interface ShowtimeSeatsData {
  showtime: ShowtimeInfo;
  cinemaId: string;
  cinemaName: string;
  hallId: string;
  hallName: string;
  layoutType: string;
  seat_map: SeatRow[];
  ticketPrices: TicketPrice[];
  rules: {
    max_selectable: number;
    hold_time_seconds: number;
  };
}

// ============================================
// Ticket Pricing Page Types
// ============================================

export interface TicketPricingItem {
  id: string;
  hallId: string;
  seatType: SeatType;
  dayType: DayType;
  price: number;
}
