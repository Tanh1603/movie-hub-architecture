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

export interface DashboardStats {
  totalMovies: number;
  totalCinemas: number;
  totalHalls: number;
  totalShowtimes: number;
  recentBookings?: number;
  revenue?: number;
}
