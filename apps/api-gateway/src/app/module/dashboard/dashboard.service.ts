import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  SERVICE_NAME,
  BookingMessage,
  CinemaMessage,
  MovieServiceMessage,
} from '@movie-hub/shared-types';

/**
 * Dashboard Aggregation Service
 *
 * Aggregates data from multiple microservices to provide a unified dashboard view.
 * Acts as a BFF (Backend-for-Frontend) for the Admin Dashboard.
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @Inject(SERVICE_NAME.BOOKING) private readonly bookingClient: ClientProxy,
    @Inject(SERVICE_NAME.CINEMA) private readonly cinemaClient: ClientProxy,
    @Inject(SERVICE_NAME.Movie) private readonly movieClient: ClientProxy
  ) {}

  /**
   * Get aggregated dashboard statistics
   */
  async getStats(cinemaId?: string): Promise<{
    totalMovies: number;
    totalCinemas: number;
    todayShowtimes: number;
    weekRevenue: number;
    totalBookings: number;
    averageRating: number;
  }> {
    this.logger.log('Use Case: Fetching dashboard stats -> START');

    try {
      this.logger.debug(
        'Dispatching parallel requests to downstream services...'
      );
      // Parallel fetch from all services
      const [allTimeBookingStats, weeklyBookingStats, cinemas, movies] =
        await Promise.all([
          this.getBookingStatistics({ cinemaId }), // All time (no filters)
          this.getBookingStatistics({
            startDate: this.getWeekStart(),
            endDate: new Date(),
            cinemaId,
          }), // Weekly (filtered)
          this.getCinemas(cinemaId),
          this.getMovies(),
        ]);

      // Calculate today's showtimes
      const todayShowtimes = await this.getTodayShowtimesCount(cinemaId);

      this.logger.log(
        `Aggregation Complete. Data: Movies=${movies.length}, Cinemas=${cinemas.length}, Showtimes=${todayShowtimes}, AllTimeBookings=${allTimeBookingStats.totalBookings}, WeekRevenue=${weeklyBookingStats.totalRevenue}`
      );

      return {
        totalMovies: movies.length,
        totalCinemas: cinemas.length,
        todayShowtimes,
        weekRevenue: weeklyBookingStats.totalRevenue || 0,
        totalBookings: allTimeBookingStats.totalBookings || 0,
        averageRating: this.calculateAverageRating(movies),
      };
    } catch (error) {
      this.logger.error('CRITICAL: Failed to aggregate dashboard stats', error);
      throw error;
    }
  }

  /**
   * Get revenue report with date filters
   */
  async getRevenueReport(filters: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
    cinemaId?: string;
  }): Promise<any> {
    this.logger.log('Fetching revenue report');

    try {
      const result = await firstValueFrom(
        this.bookingClient.send(BookingMessage.GET_REVENUE_REPORT, {
          filters: {
            startDate: filters.startDate
              ? new Date(filters.startDate)
              : undefined,
            endDate: filters.endDate ? new Date(filters.endDate) : undefined,
            groupBy: filters.groupBy || 'day',
            cinemaId: filters.cinemaId,
          },
        })
      );

      return result.data || result;
    } catch (error) {
      this.logger.error('Failed to fetch revenue report', error);
      throw error;
    }
  }

  /**
   * Get top movies by bookings (with movie metadata)
   */
  async getTopMovies(
    limit = 5,
    cinemaId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<
    Array<{
      movieId: string;
      title: string;
      posterUrl?: string;
      totalBookings: number;
      totalRevenue: number;
    }>
  > {
    this.logger.log(`Fetching top ${limit} movies by bookings`);

    try {
      // Get revenue grouped by movie from booking service
      const revenueByMovie = await firstValueFrom(
        this.bookingClient.send(BookingMessage.GET_REVENUE_BY_MOVIE, {
          startDate: startDate || this.getWeekStart(),
          endDate: endDate || new Date(),
          cinemaId,
        })
      );

      if (!revenueByMovie || revenueByMovie.length === 0) {
        return [];
      }

      // Get movie IDs to fetch metadata
      const movieIds = revenueByMovie
        .slice(0, limit)
        .map((item: any) => item.movieId);

      // Batch fetch movie metadata
      const movies = await this.getMoviesByIds(movieIds);
      const movieMap = new Map(movies.map((m: any) => [m.id, m]));

      // Combine data
      return revenueByMovie.slice(0, limit).map((item: any) => {
        const movie = movieMap.get(item.movieId);
        return {
          movieId: item.movieId,
          title: movie?.title || 'Unknown Movie',
          posterUrl: movie?.posterUrl,
          totalBookings: item.bookings || 0,
          totalRevenue: item.revenue || 0,
        };
      });
    } catch (error) {
      this.logger.error('Failed to fetch top movies', error);
      throw error;
    }
  }

  /**
   * Get top cinemas by revenue (with cinema metadata)
   */
  async getTopCinemas(
    limit = 5,
    cinemaId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<
    Array<{
      cinemaId: string;
      name: string;
      location: string;
      totalRevenue: number;
      occupancyRate: number;
    }>
  > {
    this.logger.log(`Fetching top ${limit} cinemas by revenue`);

    try {
      // Get revenue grouped by cinema from booking service
      const revenueByCinema = await firstValueFrom(
        this.bookingClient.send(BookingMessage.GET_REVENUE_BY_CINEMA, {
          startDate: startDate || this.getWeekStart(),
          endDate: endDate || new Date(),
          cinemaId, // Also pass cinemaId if we want to filter the "Top Cinemas" list to just one
        })
      );

      if (!revenueByCinema || revenueByCinema.length === 0) {
        return [];
      }

      // Get all cinemas for metadata
      const cinemas = await this.getCinemas();
      const cinemaMap = new Map(cinemas.map((c: any) => [c.id, c]));

      // Combine data
      return revenueByCinema.slice(0, limit).map((item: any) => {
        const cinema = cinemaMap.get(item.cinemaId);
        return {
          cinemaId: item.cinemaId,
          name: cinema?.name || 'Unknown Cinema',
          location: cinema?.location || cinema?.address || '',
          totalRevenue: item.revenue || 0,
          occupancyRate: item.occupancyRate || 0,
        };
      });
    } catch (error) {
      this.logger.error('Failed to fetch top cinemas', error);
      throw error;
    }
  }

  /**
   * Get recent bookings with enriched movie/cinema data
   */
  async getRecentBookings(limit = 10, cinemaId?: string): Promise<any[]> {
    this.logger.log(`Fetching ${limit} recent bookings`);

    try {
      const result = await firstValueFrom(
        this.bookingClient.send(BookingMessage.ADMIN_FIND_ALL, {
          filters: { limit, sortBy: 'created_at', sortOrder: 'desc', cinemaId },
        })
      );

      const bookings = result.data || result || [];
      return bookings;
    } catch (error) {
      this.logger.error('Failed to fetch recent bookings', error);
      throw error;
    }
  }

  /**
   * Get recent reviews with movie titles
   */
  async getRecentReviews(limit = 10): Promise<any[]> {
    this.logger.log(`Fetching ${limit} recent reviews`);

    try {
      const result = await firstValueFrom(
        this.movieClient.send(MovieServiceMessage.REVIEW.GET_LIST, {
          limit,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
      );

      const reviews = result.data || result || [];

      // Map to RecentReviewDto format expected by frontend
      return reviews.map((r: any) => ({
        id: r.id,
        movieId: r.movieId,
        movieTitle: r.movie?.title || 'Unknown Movie',
        userId: r.userId,
        userName: r.userName || 'User', // May need to fetch from user service if not present
        rating: r.rating,
        comment: r.content || r.comment || '',
        createdAt: r.createdAt,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch recent reviews', error);
      throw error;
    }
  }

  /**
   * Get occupancy rates for cinemas
   */
  async getOccupancy(
    date?: string,
    cinemaId?: string
  ): Promise<
    Array<{
      cinemaId: string;
      cinemaName: string;
      totalCapacity: number;
      soldSeats: number;
      occupancyRate: number;
    }>
  > {
    this.logger.log('Fetching occupancy rates');

    try {
      const targetDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      // Get hall capacities
      const capacities = await firstValueFrom(
        this.cinemaClient.send(CinemaMessage.HALL.GET_HALL_CAPACITIES, {})
      );

      // Get bookings for the day
      const bookingsResult = await firstValueFrom(
        this.bookingClient.send(BookingMessage.FIND_BY_DATE_RANGE, {
          filters: {
            startDate: startOfDay,
            endDate: endOfDay,
            status: 'CONFIRMED',
            limit: 10000, // Ensure we get all bookings for accurate stats
            cinemaId,
          },
        })
      );
      // ... (rest of the logic inside try)
      const bookings = bookingsResult.data || bookingsResult || [];

      // Aggregate by cinema
      const cinemaOccupancy = new Map<
        string,
        { capacity: number; sold: number; name: string }
      >();

      for (const cap of capacities || []) {
        if (!cinemaOccupancy.has(cap.cinemaId)) {
          cinemaOccupancy.set(cap.cinemaId, {
            capacity: 0,
            sold: 0,
            name: cap.cinemaName || '',
          });
        }
        const entry = cinemaOccupancy.get(cap.cinemaId)!;
        entry.capacity += cap.capacity || 0;
      }

      for (const booking of bookings) {
        const cinemaId = booking.cinemaId;
        if (cinemaId && cinemaOccupancy.has(cinemaId)) {
          const entry = cinemaOccupancy.get(cinemaId)!;
          entry.sold += booking.seatCount || 1;
        }
      }

      return Array.from(cinemaOccupancy.entries()).map(([cinemaId, data]) => ({
        cinemaId,
        cinemaName: data.name,
        totalCapacity: data.capacity,
        soldSeats: data.sold,
        occupancyRate:
          data.capacity > 0 ? Math.round((data.sold / data.capacity) * 100) : 0,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch occupancy rates', error);
      throw error;
    }
  }

  // ==================== Private Helper Methods ====================

  private async getTodayShowtimesCount(cinemaId?: string): Promise<number> {
    try {
      const today = new Date();
      const result = await firstValueFrom(
        this.cinemaClient.send(CinemaMessage.MOVIE.GET_ALL_MOVIES_AT_CINEMAS, {
          date: today.toISOString().split('T')[0],
          cinemaId,
        })
      );
      const showtimes = result.data || result || [];
      return Array.isArray(showtimes) ? showtimes.length : 0;
    } catch (error) {
      this.logger.warn('Failed to fetch today showtimes', error);
      return 0;
    }
  }

  private async getBookingStatistics(filters: {
    startDate?: Date;
    endDate?: Date;
    cinemaId?: string;
  }): Promise<{
    totalBookings: number;
    totalRevenue: number;
  }> {
    try {
      this.logger.debug(
        `Calling booking.getStatistics with filters: ${JSON.stringify(filters)}`
      );
      const result = await firstValueFrom(
        this.bookingClient.send(BookingMessage.GET_STATISTICS, {
          filters,
        })
      );
      const stats = result.data ||
        result || { totalBookings: 0, totalRevenue: 0 };
      this.logger.debug(`Booking Stats Response: ${JSON.stringify(stats)}`);
      return stats;
    } catch (error) {
      this.logger.error(
        `Failed to fetch booking statistics with filters: ${JSON.stringify(
          filters
        )}`,
        error
      );
      return { totalBookings: 0, totalRevenue: 0 };
    }
  }

  private async getCinemas(cinemaId?: string): Promise<any[]> {
    try {
      const result = await firstValueFrom(
        this.cinemaClient.send(CinemaMessage.GET_CINEMAS, 'ACTIVE')
      );
      const allCinemas: any[] = result.data || result || [];
      if (cinemaId) {
        return allCinemas.filter(
          (c) => c.id === cinemaId || c.cinemaId === cinemaId
        );
      }
      return allCinemas;
    } catch (error) {
      this.logger.warn('Failed to fetch cinemas', error);
      return [];
    }
  }

  private async getMovies(): Promise<any[]> {
    try {
      const result = await firstValueFrom(
        this.movieClient.send(MovieServiceMessage.MOVIE.GET_LIST, {
          status: 'PUBLISHED',
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
      );
      return result.data || result || [];
    } catch (error) {
      this.logger.warn('Failed to fetch movies', error);
      return [];
    }
  }

  private async getMoviesByIds(ids: string[]): Promise<any[]> {
    if (!ids || ids.length === 0) return [];
    try {
      const result = await firstValueFrom(
        this.movieClient.send(MovieServiceMessage.MOVIE.GET_LIST_BY_ID, ids)
      );
      return result.data || result || [];
    } catch (error) {
      this.logger.warn('Failed to fetch movies by IDs', error);
      return [];
    }
  }

  private calculateAverageRating(movies: any[]): number {
    if (!movies || movies.length === 0) return 0;
    const sum = movies.reduce((acc, m) => acc + (m.rating || 0), 0);
    return Math.round((sum / movies.length) * 10) / 10;
  }

  private getWeekStart(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
