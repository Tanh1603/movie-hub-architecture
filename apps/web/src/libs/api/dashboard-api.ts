/**
 * Dashboard API Client
 *
 * BFF endpoints for the Admin Dashboard.
 * All functions use the shared api-client with Clerk auth.
 */

import { api } from './api-client';

// ==================== Types ====================

export interface DashboardStatsDto {
  totalMovies: number;
  totalCinemas: number;
  todayShowtimes: number;
  weekRevenue: number;
  totalBookings: number;
  averageRating: number;
}

export interface TopMovieDto {
  movieId: string;
  title: string;
  posterUrl?: string;
  totalBookings: number;
  totalRevenue: number;
}

export interface TopCinemaDto {
  cinemaId: string;
  name: string;
  location: string;
  totalRevenue: number;
  occupancyRate: number;
}

export interface RecentBookingDto {
  id: string;
  bookingCode: string;
  showtimeId: string;
  movieTitle: string;
  cinemaName: string;
  hallName: string;
  startTime: string;
  seatCount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface RecentReviewDto {
  id: string;
  movieId: string;
  movieTitle: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface RevenueReportDto {
  totalRevenue: number;
  totalTicketRevenue: number;
  totalConcessionRevenue: number;
  totalDiscount: number;
  totalRefund: number;
  netRevenue: number;
  bookingCount: number;
  averageBookingValue: number;
  revenueByPeriod: Array<{
    period: string;
    revenue: number;
    bookingCount: number;
  }>;
  period: {
    startDate?: string;
    endDate?: string;
  };
}

export interface OccupancyDto {
  cinemaId: string;
  cinemaName: string;
  totalCapacity: number;
  soldSeats: number;
  occupancyRate: number;
}

// ==================== API Functions ====================

const DASHBOARD_BASE = '/api/v1/dashboard';

/**
 * Get dashboard KPI statistics
 */
export async function getDashboardStats(
  cinemaId?: string
): Promise<DashboardStatsDto> {
  const params = cinemaId ? `?cinemaId=${cinemaId}` : '';
  return api.get<DashboardStatsDto>(`${DASHBOARD_BASE}/stats${params}`);
}

/**
 * Get revenue report with date filters
 */
export async function getRevenueReport(filters?: {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
  cinemaId?: string;
}): Promise<RevenueReportDto> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.groupBy) params.append('groupBy', filters.groupBy);
  if (filters?.cinemaId) params.append('cinemaId', filters.cinemaId);

  return api.get<RevenueReportDto>(
    `${DASHBOARD_BASE}/revenue?${params.toString()}`
  );
}

/**
 * Get top movies by bookings
 */
/**
 * Get top movies by bookings
 */
export async function getTopMovies(
  limit = 5,
  cinemaId?: string,
  startDate?: string,
  endDate?: string
): Promise<TopMovieDto[]> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (cinemaId) params.append('cinemaId', cinemaId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  return api.get<TopMovieDto[]>(
    `${DASHBOARD_BASE}/top-movies?${params.toString()}`
  );
}

/**
 * Get top cinemas by revenue
 */
export async function getTopCinemas(
  limit = 5,
  cinemaId?: string,
  startDate?: string,
  endDate?: string
): Promise<TopCinemaDto[]> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (cinemaId) params.append('cinemaId', cinemaId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  return api.get<TopCinemaDto[]>(
    `${DASHBOARD_BASE}/top-cinemas?${params.toString()}`
  );
}

/**
 * Get recent bookings
 */
export async function getRecentBookings(
  limit = 10,
  cinemaId?: string
): Promise<RecentBookingDto[]> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (cinemaId) params.append('cinemaId', cinemaId);
  return api.get<RecentBookingDto[]>(
    `${DASHBOARD_BASE}/recent-bookings?${params.toString()}`
  );
}

/**
 * Get recent reviews
 */
export async function getRecentReviews(
  limit = 10,
  cinemaId?: string
): Promise<RecentReviewDto[]> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  // Reviews might not have cinema context easily attached unless Review has showtime/cinema linkage
  // Assuming API supports it via controller
  // But DashboardService.getRecentReviews currently DOES NOT use cinemaId (it uses MovieClient).
  // I will skip adding cinemaId param to API call if service doesn't support it, but for consistency if I update service later...
  // Service getRecentReviews currently IGNORES cinemaId.
  // I will leave it as is or add it but it won't do anything yet.
  return api.get<RecentReviewDto[]>(
    `${DASHBOARD_BASE}/recent-reviews?limit=${limit}`
  );
}

/**
 * Get occupancy rates
 */
export async function getOccupancy(
  date?: string,
  cinemaId?: string
): Promise<OccupancyDto[]> {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (cinemaId) params.append('cinemaId', cinemaId);
  return api.get<OccupancyDto[]>(
    `${DASHBOARD_BASE}/occupancy?${params.toString()}`
  );
}
