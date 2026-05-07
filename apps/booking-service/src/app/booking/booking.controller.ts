import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BookingService } from './booking.service';
import {
  CreateBookingDto,
  BookingStatus,
  AdminFindAllBookingsDto,
  FindBookingsByShowtimeDto,
  FindBookingsByDateRangeDto,
  UpdateBookingStatusDto,
  GetBookingStatisticsDto,
  GetRevenueReportDto,
  UpdateBookingDto,
  RescheduleBookingDto,
  CancelBookingWithRefundDto,
} from '@movie-hub/shared-types';

@Controller()
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @MessagePattern('booking.create')
  async create(@Payload() data: { userId: string; dto: CreateBookingDto }) {
    return this.bookingService.createBooking(data.userId, data.dto);
  }

  @MessagePattern('booking.findAll')
  async findAll(
    @Payload()
    payload: {
      userId: string;
      query?: {
        status?: BookingStatus;
        page?: number;
        limit?: number;
      };
    }
  ) {
    return this.bookingService.findAllByUser(
      payload.userId,
      payload.query || {}
    );
  }

  @MessagePattern('booking.findOne')
  async findOne(@Payload() data: { id: string; userId: string }) {
    return this.bookingService.findOne(data.id, data.userId);
  }

  @MessagePattern('booking.cancel')
  async cancel(
    @Payload() data: { id: string; userId: string; reason?: string }
  ) {
    return this.bookingService.cancelBooking(data.id, data.userId, data.reason);
  }

  @MessagePattern('booking.getSummary')
  async getSummary(@Payload() data: { id: string; userId: string }) {
    return this.bookingService.getBookingSummary(data.id, data.userId);
  }

  // ==================== ADMIN OPERATIONS ====================

  @MessagePattern('booking.admin.findAll')
  async adminFindAll(@Payload() payload: { filters: AdminFindAllBookingsDto }) {
    return this.bookingService.adminFindAllBookings(payload.filters);
  }

  @MessagePattern('booking.findByShowtime')
  async findByShowtime(@Payload() payload: FindBookingsByShowtimeDto) {
    return this.bookingService.findBookingsByShowtime(
      payload.showtimeId,
      payload.status
    );
  }

  @MessagePattern('booking.findByDateRange')
  async findByDateRange(
    @Payload() payload: { filters?: FindBookingsByDateRangeDto }
  ) {
    return this.bookingService.findBookingsByDateRange(payload.filters || {});
  }

  @MessagePattern('booking.updateStatus')
  async updateStatus(@Payload() data: UpdateBookingStatusDto) {
    return this.bookingService.updateBookingStatus(
      data.bookingId,
      data.status,
      data.reason
    );
  }

  @MessagePattern('booking.confirm')
  async confirm(@Payload() data: { bookingId: string }) {
    return this.bookingService.confirmBooking(data.bookingId);
  }

  @MessagePattern('booking.complete')
  async complete(@Payload() data: { bookingId: string }) {
    return this.bookingService.completeBooking(data.bookingId);
  }

  @MessagePattern('booking.expire')
  async expire(@Payload() data: { bookingId: string }) {
    return this.bookingService.expireBooking(data.bookingId);
  }

  // ==================== STATISTICS & REPORTS ====================

  @MessagePattern('booking.getStatistics')
  async getStatistics(
    @Payload() payload: { filters?: GetBookingStatisticsDto }
  ) {
    return this.bookingService.getBookingStatistics(payload?.filters || {});
  }

  @MessagePattern('booking.getRevenueReport')
  async getRevenueReport(
    @Payload() payload: { filters?: GetRevenueReportDto }
  ) {
    return this.bookingService.getRevenueReport(payload?.filters || {});
  }

  @MessagePattern('booking.getRevenueByMovieId')
  async getRevenueByMovieId(
    @Payload() filters: { startDate?: Date; endDate?: Date; cinemaId?: string }
  ) {
    return this.bookingService.getRevenueGroupedByMovieId(filters);
  }

  @MessagePattern('booking.getRevenueByCinemaId')
  async getRevenueByCinemaId(
    @Payload() filters: { startDate?: Date; endDate?: Date; cinemaId?: string }
  ) {
    return this.bookingService.getRevenueGroupedByCinemaId(filters);
  }

  // ==================== NEW FEATURES ====================

  /**
   * @deprecated Use POST /refunds/booking/:bookingId/voucher instead.
   * This endpoint uses the legacy 2-hour/70% cash refund policy.
   */
  @MessagePattern('booking.calculateRefund')
  async calculateRefund(@Payload() data: { id: string; userId: string }) {
    return this.bookingService.calculateRefund(data.id, data.userId);
  }

  /**
   * @deprecated Use POST /refunds/booking/:bookingId/voucher instead.
   * This endpoint uses the legacy cancellation policy without voucher generation.
   */
  @MessagePattern('booking.cancelWithRefund')
  async cancelWithRefund(
    @Payload()
    data: {
      id: string;
      userId: string;
      dto: CancelBookingWithRefundDto;
    }
  ) {
    return this.bookingService.cancelBookingWithRefund(
      data.id,
      data.userId,
      data.dto
    );
  }

  @MessagePattern('booking.update')
  async update(
    @Payload() data: { id: string; userId: string; dto: UpdateBookingDto }
  ) {
    return this.bookingService.updateBooking(data.id, data.userId, data.dto);
  }

  @MessagePattern('booking.reschedule')
  async reschedule(
    @Payload() data: { id: string; userId: string; dto: RescheduleBookingDto }
  ) {
    return this.bookingService.rescheduleBooking(
      data.id,
      data.userId,
      data.dto
    );
  }

  @MessagePattern('booking.getCancellationPolicy')
  async getCancellationPolicy() {
    const result = await this.bookingService.getCancellationPolicy();
    return { data: result };
  }

  @MessagePattern('booking.findUserBookingByShowtime')
  async findUserBookingByShowtime(
    @Payload()
    data: {
      showtimeId: string;
      userId: string;
      includeStatuses?: BookingStatus[];
    }
  ) {
    return this.bookingService.findUserBookingByShowtime(
      data.showtimeId,
      data.userId,
      data.includeStatuses
    );
  }
}
