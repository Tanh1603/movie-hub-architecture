import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Header,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { BookingService } from '../service/booking.service';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';
import { CurrentUserId } from '../../../common/decorator/current-user-id.decorator';
import {
  CreateBookingDto,
  BookingStatus,
  BookingCalculationDto,
  AdminFindAllBookingsDto,
  FindBookingsByDateRangeDto,
  GetBookingStatisticsDto,
  GetRevenueReportDto,
  UpdateBookingDto,
  RescheduleBookingDto,
  CancelBookingWithRefundDto,
} from '@movie-hub/shared-types';
import { PaginationQuery } from '@movie-hub/shared-types/common';

@Controller({
  version: '1',
  path: 'bookings',
})
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  async create(
    @CurrentUserId() userId: string,
    @Body() createBookingDto: CreateBookingDto
  ) {
    return this.bookingService.createBooking(userId, createBookingDto);
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  async findAll(
    @CurrentUserId() userId: string,
    @Query('status') status?: BookingStatus,
    @Query() pagination?: PaginationQuery
  ) {
    return this.bookingService.findAllByUser(
      userId,
      status,
      pagination?.page,
      pagination?.limit
    );
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  async findOne(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.bookingService.findOne(id, userId);
  }

  @Post(':id/cancel')
  @UseGuards(ClerkAuthGuard)
  async cancel(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string
  ) {
    return this.bookingService.cancelBooking(id, userId, reason);
  }

  @Get(':id/summary')
  @UseGuards(ClerkAuthGuard)
  async getSummary(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.bookingService.getBookingSummary(id, userId);
  }

  /**
   * GET /v1/bookings/showtime/:showtimeId/check
   * Check if user has existing booking for this showtime
   * Used when entering showtime screen
   */
  @Get('showtime/:showtimeId/check')
  @UseGuards(ClerkAuthGuard)
  async checkUserBookingAtShowtime(
    @CurrentUserId() userId: string,
    @Param('showtimeId') showtimeId: string,
    @Query('includeStatuses') includeStatuses?: string
  ) {
    // Parse comma-separated statuses if provided
    const statuses = includeStatuses
      ? includeStatuses.split(',').map((s) => s.trim() as BookingStatus)
      : undefined;

    return this.bookingService.findUserBookingByShowtime(
      showtimeId,
      userId,
      statuses
    );
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/all')
  @UseGuards(ClerkAuthGuard)
  async adminFindAll(
    @Req() req: any,
    @Query() filters: AdminFindAllBookingsDto
  ) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      filters.cinemaId = userCinemaId;
    }
    return this.bookingService.adminFindAll(filters);
  }

  @Get('admin/showtime/:showtimeId')
  @UseGuards(ClerkAuthGuard)
  async findByShowtime(
    @Req() req: any,
    @Param('showtimeId') showtimeId: string,
    @Query('status') status?: BookingStatus
  ) {
    // TODO: For full RBAC, verify that the showtime belongs to the user's cinema
    // This requires fetching showtime details to check cinemaId
    return this.bookingService.findByShowtime(showtimeId, status);
  }

  @Get('admin/date-range')
  @UseGuards(ClerkAuthGuard)
  async findByDateRange(
    @Req() req: any,
    @Query() filters: FindBookingsByDateRangeDto
  ) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      filters.cinemaId = userCinemaId;
    }
    return this.bookingService.findByDateRange(filters);
  }

  @Put('admin/:id/status')
  @UseGuards(ClerkAuthGuard)
  async updateStatus(
    @Req() req: any,
    @Param('id') bookingId: string,
    @Body('status') status: BookingStatus,
    @Body('reason') reason?: string
  ) {
    // TODO: For full RBAC, verify that the booking belongs to the user's cinema
    // This requires fetching booking details to check cinemaId
    return this.bookingService.updateStatus(bookingId, status, reason);
  }

  @Post('admin/:id/confirm')
  @UseGuards(ClerkAuthGuard)
  async confirmBooking(@Req() req: any, @Param('id') bookingId: string) {
    // TODO: For full RBAC, verify that the booking belongs to the user's cinema
    return this.bookingService.confirmBooking(bookingId);
  }

  @Post('admin/:id/complete')
  @UseGuards(ClerkAuthGuard)
  async completeBooking(@Req() req: any, @Param('id') bookingId: string) {
    // TODO: For full RBAC, verify that the booking belongs to the user's cinema
    return this.bookingService.completeBooking(bookingId);
  }

  @Post('admin/:id/expire')
  @UseGuards(ClerkAuthGuard)
  async expireBooking(@Req() req: any, @Param('id') bookingId: string) {
    // TODO: For full RBAC, verify that the booking belongs to the user's cinema
    return this.bookingService.expireBooking(bookingId);
  }

  @Get('admin/statistics')
  @UseGuards(ClerkAuthGuard)
  async getStatistics(
    @Req() req: any,
    @Query() filters: GetBookingStatisticsDto
  ) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      filters.cinemaId = userCinemaId;
    }
    return this.bookingService.getStatistics(filters);
  }

  @Get('admin/revenue-report')
  @UseGuards(ClerkAuthGuard)
  async getRevenueReport(
    @Req() req: any,
    @Query() filters: GetRevenueReportDto
  ) {
    const userCinemaId = req.staffContext?.cinemaId;
    if (userCinemaId) {
      filters.cinemaId = userCinemaId;
    }
    return this.bookingService.getRevenueReport(filters);
  }

  // ==================== BOOKING ACTIONS ====================

  @Put(':id')
  @UseGuards(ClerkAuthGuard)
  async updateBooking(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto
  ) {
    return this.bookingService.updateBooking(id, userId, dto);
  }

  @Post(':id/reschedule')
  @UseGuards(ClerkAuthGuard)
  async rescheduleBooking(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: RescheduleBookingDto
  ) {
    return this.bookingService.rescheduleBooking(id, userId, dto);
  }

  @Get(':id/refund-calculation')
  @UseGuards(ClerkAuthGuard)
  @Header('Deprecation', 'true')
  @Header('X-Deprecation-Notice', 'Use POST /refunds/booking/:id/voucher')
  async calculateRefund(
    @CurrentUserId() userId: string,
    @Param('id') id: string
  ) {
    return this.bookingService.calculateRefund(id, userId);
  }

  @Post(':id/cancel-with-refund')
  @UseGuards(ClerkAuthGuard)
  @Header('Deprecation', 'true')
  @Header('X-Deprecation-Notice', 'Use POST /refunds/booking/:id/voucher')
  async cancelWithRefund(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: CancelBookingWithRefundDto
  ) {
    return this.bookingService.cancelWithRefund(id, userId, dto);
  }

  @Get('cancellation-policy')
  async getCancellationPolicy() {
    return this.bookingService.getCancellationPolicy();
  }
}
