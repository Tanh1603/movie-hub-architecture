import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ClerkAuthGuard } from '../../common/guard/clerk-auth.guard';
import { TransformInterceptor } from '../../common/interceptor/transform.interceptor';

/**
 * Dashboard Controller
 *
 * BFF (Backend-for-Frontend) endpoints for the Admin Dashboard.
 * Aggregates data from multiple microservices into dashboard-ready formats.
 */
@Controller({
  version: '1',
  path: 'dashboard',
})
@UseGuards(ClerkAuthGuard)
@UseInterceptors(new TransformInterceptor())
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /v1/dashboard/stats
   * Returns KPI summary: total movies, cinemas, revenue, bookings, etc.
   */
  @Get('stats')
  async getStats(@Req() req: any, @Query('cinemaId') cinemaId?: string) {
    const activeCinemaId = req.staffContext?.cinemaId || cinemaId;
    return { data: await this.dashboardService.getStats(activeCinemaId) };
  }

  /**
   * GET /v1/dashboard/revenue
   * Returns revenue report with optional date filters
   */
  @Get('revenue')
  async getRevenueReport(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy?: 'day' | 'week' | 'month',
    @Query('cinemaId') cinemaId?: string
  ) {
    const activeCinemaId = req.staffContext?.cinemaId || cinemaId;
    const result = await this.dashboardService.getRevenueReport({
      startDate,
      endDate,
      groupBy,
      cinemaId: activeCinemaId,
    });
    return { data: result };
  }

  /**
   * GET /v1/dashboard/top-movies
   * Returns top movies by bookings with movie metadata
   */
  @Get('top-movies')
  async getTopMovies(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('cinemaId') cinemaId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    const activeCinemaId = req.staffContext?.cinemaId || cinemaId;
    return {
      data: await this.dashboardService.getTopMovies(
        parsedLimit,
        activeCinemaId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      ),
    };
  }

  /**
   * GET /v1/dashboard/top-cinemas
   * Returns top cinemas by revenue with cinema metadata
   */
  @Get('top-cinemas')
  async getTopCinemas(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('cinemaId') cinemaId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    const activeCinemaId = req.staffContext?.cinemaId || cinemaId;
    return {
      data: await this.dashboardService.getTopCinemas(
        parsedLimit,
        activeCinemaId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      ),
    };
  }

  /**
   * GET /v1/dashboard/recent-bookings
   * Returns latest bookings with enriched movie/cinema data
   */
  @Get('recent-bookings')
  @Get('recent-bookings')
  async getRecentBookings(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('cinemaId') cinemaId?: string
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const activeCinemaId = req.staffContext?.cinemaId || cinemaId;
    return {
      data: await this.dashboardService.getRecentBookings(
        parsedLimit,
        activeCinemaId
      ),
    };
  }

  /**
   * GET /v1/dashboard/recent-reviews
   * Returns latest reviews with movie titles
   */
  @Get('recent-reviews')
  async getRecentReviews(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return { data: await this.dashboardService.getRecentReviews(parsedLimit) };
  }

  /**
   * GET /v1/dashboard/occupancy
   * Returns hall occupancy rates for a given date (defaults to today)
   */
  @Get('occupancy')
  @Get('occupancy')
  async getOccupancy(
    @Req() req: any,
    @Query('date') date?: string,
    @Query('cinemaId') cinemaId?: string
  ) {
    const activeCinemaId = req.staffContext?.cinemaId || cinemaId;
    return {
      data: await this.dashboardService.getOccupancy(date, activeCinemaId),
    };
  }
}
