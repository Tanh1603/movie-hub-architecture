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
import { attachRequestContextToPayload } from '@movie-hub/shared-types/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BookingService {
  constructor(
    @Inject(SERVICE_NAME.BOOKING) private readonly bookingClient: ClientProxy
  ) {}

  private sendWithContext<T>(
    pattern: string,
    payload: Record<string, unknown>,
    request?: unknown
  ): Promise<T> {
    return lastValueFrom(
      this.bookingClient.send(
        pattern,
        attachRequestContextToPayload(
          payload,
          request as Record<string, unknown> | undefined
        )
      )
    );
  }

  async createBooking(
    userId: string,
    dto: CreateBookingDto,
    request?: unknown
  ): Promise<ServiceResult<BookingCalculationDto>> {
    return this.sendWithContext(BookingMessage.CREATE, { userId, dto }, request);
  }

  async findAllByUser(
    userId: string,
    status?: BookingStatus,
    page?: number,
    limit?: number,
    request?: unknown
  ): Promise<ServiceResult<BookingSummaryDto[]>> {
    return this.sendWithContext(
      BookingMessage.FIND_ALL,
      {
        userId,
        query: { status, page, limit },
      },
      request
    );
  }

  async findOne(
    id: string,
    userId: string,
    request?: unknown
  ): Promise<ServiceResult<BookingDetailDto>> {
    return this.sendWithContext(BookingMessage.FIND_ONE, { id, userId }, request);
  }

  async cancelBooking(
    id: string,
    userId: string,
    reason?: string,
    request?: unknown
  ): Promise<ServiceResult<BookingDetailDto>> {
    return this.sendWithContext(
      BookingMessage.CANCEL,
      { id, userId, reason },
      request
    );
  }

  async getBookingSummary(
    id: string,
    userId: string,
    request?: unknown
  ): Promise<ServiceResult<BookingCalculationDto>> {
    return this.sendWithContext(
      BookingMessage.GET_SUMMARY,
      { id, userId },
      request
    );
  }

  /**
   * Find user's booking at a specific showtime
   * Used when entering showtime screen to check if user already has a booking
   */
  async findUserBookingByShowtime(
    showtimeId: string,
    userId: string,
    includeStatuses?: BookingStatus[],
    request?: unknown
  ): Promise<ServiceResult<BookingCalculationDto | null>> {
    return this.sendWithContext(
      BookingMessage.FIND_USER_BOOKING_BY_SHOWTIME,
      {
        showtimeId,
        userId,
        includeStatuses,
      },
      request
    );
  }

  // ==================== ADMIN OPERATIONS ====================

  async adminFindAll(
    filters: AdminFindAllBookingsDto,
    request?: unknown
  ): Promise<ServiceResult<BookingSummaryDto[]>> {
    return this.sendWithContext(
      BookingMessage.ADMIN_FIND_ALL,
      { filters },
      request
    );
  }

  async findByShowtime(
    showtimeId: string,
    status?: BookingStatus,
    request?: unknown
  ): Promise<ServiceResult<BookingSummaryDto[]>> {
    return this.sendWithContext(
      BookingMessage.FIND_BY_SHOWTIME,
      {
        showtimeId,
        status,
      },
      request
    );
  }

  async findByDateRange(
    filters: FindBookingsByDateRangeDto,
    request?: unknown
  ): Promise<ServiceResult<BookingSummaryDto[]>> {
    return this.sendWithContext(
      BookingMessage.FIND_BY_DATE_RANGE,
      { filters },
      request
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
    reason?: string,
    request?: unknown
  ): Promise<ServiceResult<BookingDetailDto>> {
    return this.sendWithContext(
      BookingMessage.UPDATE_STATUS,
      {
        bookingId,
        status,
        reason,
      },
      request
    );
  }

  async confirmBooking(
    bookingId: string,
    request?: unknown
  ): Promise<ServiceResult<BookingDetailDto>> {
    return this.sendWithContext(BookingMessage.CONFIRM, { bookingId }, request);
  }

  async completeBooking(
    bookingId: string,
    request?: unknown
  ): Promise<ServiceResult<BookingDetailDto>> {
    return this.sendWithContext(BookingMessage.COMPLETE, { bookingId }, request);
  }

  async expireBooking(
    bookingId: string,
    request?: unknown
  ): Promise<ServiceResult<BookingDetailDto>> {
    return this.sendWithContext(BookingMessage.EXPIRE, { bookingId }, request);
  }

  async getStatistics(
    filters: GetBookingStatisticsDto,
    request?: unknown
  ): Promise<ServiceResult<unknown>> {
    return this.sendWithContext(
      BookingMessage.GET_STATISTICS,
      { filters },
      request
    );
  }

  async getRevenueReport(
    filters: GetRevenueReportDto,
    request?: unknown
  ): Promise<ServiceResult<unknown>> {
    return this.sendWithContext(
      BookingMessage.GET_REVENUE_REPORT,
      { filters },
      request
    );
  }

  // ==================== BOOKING ACTIONS ====================

  async updateBooking(
    id: string,
    userId: string,
    dto: UpdateBookingDto,
    request?: unknown
  ): Promise<ServiceResult<BookingDetailDto>> {
    return this.sendWithContext(
      BookingMessage.UPDATE,
      { id, userId, dto },
      request
    );
  }

  async rescheduleBooking(
    id: string,
    userId: string,
    dto: RescheduleBookingDto,
    request?: unknown
  ): Promise<ServiceResult<BookingDetailDto>> {
    return this.sendWithContext(
      BookingMessage.RESCHEDULE,
      { id, userId, dto },
      request
    );
  }

  async calculateRefund(
    id: string,
    userId: string,
    request?: unknown
  ): Promise<ServiceResult<RefundCalculationDto>> {
    return this.sendWithContext(
      BookingMessage.CALCULATE_REFUND,
      { id, userId },
      request
    );
  }

  async cancelWithRefund(
    id: string,
    userId: string,
    dto: CancelBookingWithRefundDto,
    request?: Record<string, unknown>
  ): Promise<ServiceResult<{ booking: BookingDetailDto; refund?: RefundCalculationDto }>> {
    return this.sendWithContext(
      BookingMessage.CANCEL_WITH_REFUND,
      {
        id,
        userId,
        dto,
      },
      request
    );
  }

  async getCancellationPolicy(
    request?: Record<string, unknown>
  ): Promise<ServiceResult<unknown>> {
    return this.sendWithContext(
      BookingMessage.GET_CANCELLATION_POLICY,
      {},
      request
    );
  }
}
