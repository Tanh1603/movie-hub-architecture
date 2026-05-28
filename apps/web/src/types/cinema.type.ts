import {
  HallTypeEnum,
  LayoutTypeEnum,
  SeatTypeEnum,
  DayTypeEnum,
  SeatStatusEnum,
  CinemaStatusEnum,
} from '@movie-hub/shared-types/cinema/enum';
import type { PaginationParams } from './api.type';

export type HallType = HallTypeEnum | string;
export type LayoutType = LayoutTypeEnum | string;
export type SeatType = SeatTypeEnum | string;
export type DayType = DayTypeEnum | string;
export type SeatStatus = SeatStatusEnum | string;
export type CinemaStatus = CinemaStatusEnum | string;

export interface GetCinemasNearbyDto {
  latitude: number;
  longitude: number;
  radiusKm?: number; // default: 10
  limit?: number; // default: 20
}

export interface GetCinemasWithFiltersDto {
  // Location
  latitude?: number;
  longitude?: number;
  radiusKm?: number;

  // Filters
  city?: string;
  district?: string;
  amenities?: string[]; // ["parking", "food_court"]
  hallTypes?: string[]; // ["IMAX", "VIP"]
  minRating?: number;

  // Pagination & Sort
  page?: number;
  limit?: number;
  sortBy?: 'distance' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface GetCinemaDetailDto {
  cinemaId: string;
  userLatitude?: number;
  userLongitude?: number;
}

export interface CinemaLocationResponse {
  id: string;
  name: string;
  address: string;
  city: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;

  location: {
    latitude: number;
    longitude: number;
    distance?: number; // in km
    distanceText?: string; // "2.5 km"
  };

  description?: string;
  amenities: string[];
  images: string[];

  rating?: number;
  totalReviews: number;

  operatingHours?: any;
  isOpen?: boolean;

  availableHallTypes: string[];
  totalHalls: number;

  status: string;

  mapUrl?: string;
  directionsUrl?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CinemaListResponse {
  cinemas: CinemaLocationResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// ADMIN/API TYPES
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

export interface Seat {
  id: string;
  rowLetter: string;
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
  capacity: number;
  rows: number;
  screenType?: string;
  soundSystem?: string;
  features?: string[];
  layoutType?: LayoutType;
  status?: string;
  seatMap?: PhysicalSeatRow[];
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
