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
import { RoleGuard } from '../../../common/guard/role.guard';
import { Permission } from '../../../common/decorator/permission.decorator';
import { CurrentUserId } from '../../../common/decorator/current-user-id.decorator';
import { Roles } from '../../../common/decorator/roles.decorator';
import { AppRole } from '@movie-hub/shared-types';
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

  private async enforceShowtimeOwnership(
    req: any,
    showtimeId: string
  ): Promise<void> {
    const userCinemaId = req.staffContext?.cinemaId;
    if (!userCinemaId) return;

    // Defense-in-depth: managers can only read bookings for their own cinema.
    const context = await this.bookingService.getShowtimeContext(showtimeId);
    if (context.cinemaId !== userCinemaId) {
      throw new ForbiddenException(
        'You can only access showtimes in your own cinema'
      );
    }
  }

  private async enforceBookingOwnership(
    req: any,
    bookingId: string
  ): Promise<void> {
    const userCinemaId = req.staffContext?.cinemaId;
    if (!userCinemaId) return;

    // Defense-in-depth: mutation endpoints must remain scoped to manager's cinema.
    const context = await this.bookingService.getAdminBookingContext(bookingId);
    if (context.cinemaId !== userCinemaId) {
      throw new ForbiddenException(
        'You can only manage bookings in your own cinema'
      );
    }
  }

  @Post()
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CUSTOMER)
  async create(
    @CurrentUserId() userId: string,
    @Body() createBookingDto: CreateBookingDto
  ) {
    return this.bookingService.createBooking(userId, createBookingDto);
  }

  @Get()
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CUSTOMER)
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
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CUSTOMER)
  async findOne(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.bookingService.findOne(id, userId);
  }

  @Post(':id/cancel')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CUSTOMER)
  async cancel(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string
  ) {
    return this.bookingService.cancelBooking(id, userId, reason);
  }

  @Get(':id/summary')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CUSTOMER)
  async getSummary(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.bookingService.getBookingSummary(id, userId);
  }

  /**
   * GET /v1/bookings/showtime/:showtimeId/check
   * Check if user has existing booking for this showtime
   * Used when entering showtime screen
   */
  @Get('showtime/:showtimeId/check')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CUSTOMER)
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
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.STAFF)
  @Permission({ resource: 'booking', action: 'read', scope: 'cinema' })
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
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.STAFF)
  @Permission({ resource: 'booking', action: 'read', scope: 'cinema' })
  async findByShowtime(
    @Req() req: any,
    @Param('showtimeId') showtimeId: string,
    @Query('status') status?: BookingStatus
  ) {
    await this.enforceShowtimeOwnership(req, showtimeId);
    return this.bookingService.findByShowtime(showtimeId, status);
  }

  @Get('admin/date-range')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.STAFF)
  @Permission({ resource: 'booking', action: 'read', scope: 'cinema' })
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
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CINEMA_MANAGER)
  @Permission({ resource: 'booking', action: 'update', scope: 'cinema' })
  async updateStatus(
    @Req() req: any,
    @Param('id') bookingId: string,
    @Body('status') status: BookingStatus,
    @Body('reason') reason?: string
  ) {
    await this.enforceBookingOwnership(req, bookingId);
    return this.bookingService.updateStatus(bookingId, status, reason);
  }

  @Post('admin/:id/confirm')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CINEMA_MANAGER)
  @Permission({ resource: 'booking', action: 'update', scope: 'cinema' })
  async confirmBooking(@Req() req: any, @Param('id') bookingId: string) {
    await this.enforceBookingOwnership(req, bookingId);
    return this.bookingService.confirmBooking(bookingId);
  }

  @Post('admin/:id/complete')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CINEMA_MANAGER)
  @Permission({ resource: 'booking', action: 'update', scope: 'cinema' })
  async completeBooking(@Req() req: any, @Param('id') bookingId: string) {
    await this.enforceBookingOwnership(req, bookingId);
    return this.bookingService.completeBooking(bookingId);
  }

  @Post('admin/:id/expire')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CINEMA_MANAGER)
  @Permission({ resource: 'booking', action: 'update', scope: 'cinema' })
  async expireBooking(@Req() req: any, @Param('id') bookingId: string) {
    await this.enforceBookingOwnership(req, bookingId);
    return this.bookingService.expireBooking(bookingId);
  }

  @Get('admin/statistics')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CINEMA_MANAGER)
  @Permission({ resource: 'booking', action: 'read', scope: 'cinema' })
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
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CINEMA_MANAGER)
  @Permission({ resource: 'booking', action: 'read', scope: 'cinema' })
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
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CUSTOMER)
  async updateBooking(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto
  ) {
    return this.bookingService.updateBooking(id, userId, dto);
  }

  @Post(':id/reschedule')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CUSTOMER)
  async rescheduleBooking(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: RescheduleBookingDto
  ) {
    return this.bookingService.rescheduleBooking(id, userId, dto);
  }

  @Get(':id/refund-calculation')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CUSTOMER)
  @Header('Deprecation', 'true')
  @Header('X-Deprecation-Notice', 'Use POST /refunds/booking/:id/voucher')
  async calculateRefund(
    @CurrentUserId() userId: string,
    @Param('id') id: string
  ) {
    return this.bookingService.calculateRefund(id, userId);
  }

  @Post(':id/cancel-with-refund')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CUSTOMER)
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


