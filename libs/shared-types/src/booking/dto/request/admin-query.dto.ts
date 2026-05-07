import { BookingStatus, PaymentStatus } from '../../enum';
import { PaginationQuery, SortQuery } from '../../../common';

/**
 * Query parameters for admin to find all bookings
 */
export interface AdminFindAllBookingsDto extends PaginationQuery, SortQuery {
  userId?: string;
  showtimeId?: string;
  cinemaId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'created_at' | 'final_amount' | 'expires_at';
}

/**
 * Query parameters for finding bookings by showtime
 */
export interface FindBookingsByShowtimeDto {
  showtimeId: string;
  status?: BookingStatus;
}

/**
 * Query parameters for finding bookings by cinema
 */
export interface FindBookingsByCinemaDto extends PaginationQuery {
  cinemaId: string;
  startDate?: Date;
  endDate?: Date;
  status?: BookingStatus;
}

/**
 * Query parameters for finding bookings by date range
 */
export interface FindBookingsByDateRangeDto extends PaginationQuery {
  startDate: Date;
  endDate: Date;
  status?: BookingStatus;
  cinemaId?: string;
}

/**
 * Request to update booking status (admin only)
 */
export interface UpdateBookingStatusDto {
  bookingId: string;
  status: BookingStatus;
  reason?: string;
}

/**
 * Request for booking statistics
 */
export interface GetBookingStatisticsDto {
  startDate?: Date;
  endDate?: Date;
  cinemaId?: string;
  showtimeId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'cinema' | 'movie';
}

/**
 * Request for revenue report
 */
export interface GetRevenueReportDto {
  startDate: Date;
  endDate: Date;
  cinemaId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'cinema';
}
