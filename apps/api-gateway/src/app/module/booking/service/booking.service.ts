import {
  SERVICE_NAME,
  CreateBookingDto,
  BookingDetailDto,
  BookingSummaryDto,
  BookingCalculationDto,
  BookingStatus,
  BookingMessage,
  AdminFindAllBookingsDto,
  FindBookingsByDateRangeDto,
  GetBookingStatisticsDto,
  GetRevenueReportDto,
  UpdateBookingDto,
  RescheduleBookingDto,
  RefundCalculationDto,
  CancelBookingWithRefundDto,
  ServiceResult,
} from '@movie-hub/shared-types';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BookingService {
  constructor(
    @Inject(SERVICE_NAME.BOOKING) private readonly bookingClient: ClientProxy
  ) {}

  async createBooking(
    userId: string,
    dto: CreateBookingDto
  ): Promise<ServiceResult<BookingCalculationDto>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.CREATE, { userId, dto })
    );
  }

  async findAllByUser(
    userId: string,
    status?: BookingStatus,
    page?: number,
    limit?: number
  ): Promise<ServiceResult<BookingSummaryDto[]>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.FIND_ALL, {
        userId,
        query: { status, page, limit },
      })
    );
  }

  async findOne(id: string, userId: string): Promise<ServiceResult<BookingDetailDto>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.FIND_ONE, { id, userId })
    );
  }

  async cancelBooking(
    id: string,
    userId: string,
    reason?: string
  ): Promise<ServiceResult<BookingDetailDto>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.CANCEL, { id, userId, reason })
    );
  }

  async getBookingSummary(
    id: string,
    userId: string
  ): Promise<ServiceResult<BookingCalculationDto>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.GET_SUMMARY, { id, userId })
    );
  }

  /**
   * Find user's booking at a specific showtime
   * Used when entering showtime screen to check if user already has a booking
   */
  async findUserBookingByShowtime(
    showtimeId: string,
    userId: string,
    includeStatuses?: BookingStatus[]
  ): Promise<ServiceResult<BookingCalculationDto | null>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.FIND_USER_BOOKING_BY_SHOWTIME, {
        showtimeId,
        userId,
        includeStatuses,
      })
    );
  }

  // ==================== ADMIN OPERATIONS ====================

  async adminFindAll(
    filters: AdminFindAllBookingsDto
  ): Promise<ServiceResult<BookingSummaryDto[]>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.ADMIN_FIND_ALL, { filters })
    );
  }

  async findByShowtime(
    showtimeId: string,
    status?: BookingStatus
  ): Promise<ServiceResult<BookingSummaryDto[]>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.FIND_BY_SHOWTIME, {
        showtimeId,
        status,
      })
    );
  }

  async findByDateRange(
    filters: FindBookingsByDateRangeDto
  ): Promise<ServiceResult<BookingSummaryDto[]>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.FIND_BY_DATE_RANGE, { filters })
    );
  }

  async getShowtimeContext(showtimeId: string): Promise<{
    showtimeId: string;
    cinemaId: string;
  }> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.GET_SHOWTIME_CONTEXT, {
        showtimeId,
      })
    );
  }

  async getAdminBookingContext(bookingId: string): Promise<{
    bookingId: string;
    showtimeId: string;
    cinemaId: string;
  }> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.GET_ADMIN_BOOKING_CONTEXT, {
        bookingId,
      })
    );
  }

  async updateStatus(
    bookingId: string,
    status: BookingStatus,
    reason?: string
  ): Promise<ServiceResult<BookingDetailDto>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.UPDATE_STATUS, {
        bookingId,
        status,
        reason,
      })
    );
  }

  async confirmBooking(bookingId: string): Promise<ServiceResult<BookingDetailDto>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.CONFIRM, { bookingId })
    );
  }

  async completeBooking(bookingId: string): Promise<ServiceResult<BookingDetailDto>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.COMPLETE, { bookingId })
    );
  }

  async expireBooking(bookingId: string): Promise<ServiceResult<BookingDetailDto>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.EXPIRE, { bookingId })
    );
  }

  async getStatistics(
    filters: GetBookingStatisticsDto
  ): Promise<ServiceResult<unknown>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.GET_STATISTICS, { filters })
    );
  }

  async getRevenueReport(
    filters: GetRevenueReportDto
  ): Promise<ServiceResult<unknown>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.GET_REVENUE_REPORT, { filters })
    );
  }

  // ==================== BOOKING ACTIONS ====================

  async updateBooking(
    id: string,
    userId: string,
    dto: UpdateBookingDto
  ): Promise<ServiceResult<BookingDetailDto>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.UPDATE, { id, userId, dto })
    );
  }

  async rescheduleBooking(
    id: string,
    userId: string,
    dto: RescheduleBookingDto
  ): Promise<ServiceResult<BookingDetailDto>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.RESCHEDULE, { id, userId, dto })
    );
  }

  async calculateRefund(
    id: string,
    userId: string
  ): Promise<ServiceResult<RefundCalculationDto>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.CALCULATE_REFUND, { id, userId })
    );
  }

  async cancelWithRefund(
    id: string,
    userId: string,
    dto: CancelBookingWithRefundDto
  ): Promise<ServiceResult<{ booking: BookingDetailDto; refund?: RefundCalculationDto }>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.CANCEL_WITH_REFUND, {
        id,
        userId,
        dto,
      })
    );
  }

  async getCancellationPolicy(): Promise<ServiceResult<unknown>> {
    return lastValueFrom(
      this.bookingClient.send(BookingMessage.GET_CANCELLATION_POLICY, {})
    );
  }
}
