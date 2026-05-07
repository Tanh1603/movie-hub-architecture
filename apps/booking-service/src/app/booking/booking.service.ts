import {
  Injectable,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';
import {
  CreateBookingDto,
  BookingDetailDto,
  BookingSummaryDto,
  BookingCalculationDto,
  BookingStatus,
  PaymentStatus,
  TicketStatus,
  CinemaMessage,
  ShowtimeSeatResponse,
  SeatItemDto,
  SeatRowDto,
  SeatTypeEnum,
  FormatEnum,
  SeatPricingDto,
  SeatPricingWithTtlDto,
  SeatStatusEnum,
  ReservationStatusEnum,
  UpdateBookingDto,
  RescheduleBookingDto,
  RefundCalculationDto,
  CancelBookingWithRefundDto,
  ServiceResult,
  AdminFindAllBookingsDto,
  SERVICE_NAME,
} from '@movie-hub/shared-types';
import {
  Prisma,
  Concessions,
  Tickets,
  PromotionType,
} from '../../../generated/prisma';

// Type for booking with full relations using Prisma's generated types
type BookingWithRelations = Prisma.BookingsGetPayload<{
  include: {
    tickets: true;
    booking_concessions: {
      include: {
        concession: true;
      };
    };
  };
}>;

// Type for seat detail from showtime response
interface SeatDetail extends SeatItemDto {
  row: string;
  type: SeatTypeEnum;
}

@Injectable()
export class BookingService {
  // Refund policy constants
  private readonly CANCELLATION_HOURS_BEFORE = 2; // Must cancel 2 hours before showtime
  private readonly REFUND_PERCENTAGE = 70; // 70% refund on tickets
  private readonly MAX_RESCHEDULES = 1; // Max 1 reschedule per booking

  private readonly logger = new Logger(BookingService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(SERVICE_NAME.CINEMA) private cinemaClient: ClientProxy,
    @Inject(SERVICE_NAME.USER) private userClient: ClientProxy,
    private notificationService: NotificationService
  ) {}

  async createBooking(
    userId: string,
    dto: CreateBookingDto
  ): Promise<ServiceResult<BookingCalculationDto>> {
    // ✅ STEP 0: Check if user already has a pending booking for this showtime
    const existingPendingBooking = await this.prisma.bookings.findFirst({
      where: {
        user_id: userId,
        showtime_id: dto.showtimeId,
        status: BookingStatus.PENDING,
        expires_at: {
          gte: new Date(), // Not expired yet
        },
      },
    });

    if (existingPendingBooking) {
      // Return the existing booking instead of throwing error
      return this.getBookingSummary(existingPendingBooking.id, userId);
    }

    // ✅ STEP 1: Create BLANK booking for the showtime (no validation, minimal data)
    // This gives the user a booking session to work with
    const bookingCode = this.generateBookingCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

    const blankBooking = await this.prisma.bookings.create({
      data: {
        booking_code: bookingCode,
        user_id: userId,
        showtime_id: dto.showtimeId,
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        subtotal: 0,
        discount: 0,
        points_used: 0,
        points_discount: 0,
        final_amount: 0,
        status: BookingStatus.PENDING,
        payment_status: PaymentStatus.PENDING,
        expires_at: expiresAt,
      },
    });

    // ✅ STEP 2: Return blank booking summary
    return this.getBookingSummary(blankBooking.id, userId);
  }

  async findAllByUser(
    userId: string,
    query: {
      status?: BookingStatus;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ServiceResult<BookingSummaryDto[]>> {
    const { status, page = 1, limit = 10 } = query || {};
    const skip = (page - 1) * limit;

    const where: Prisma.BookingsWhereInput = { user_id: userId };
    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      this.prisma.bookings.findMany({
        where,
        include: {
          tickets: true,
          booking_concessions: {
            include: {
              concession: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bookings.count({ where }),
    ]);

    // Fetch showtime data for all bookings
    const showtimePromises = bookings.map(async (booking) => {
      try {
        return await this.getShowtimeDetails(booking.showtime_id, userId);
      } catch {
        return null;
      }
    });

    const showtimeDataArray = await Promise.all(showtimePromises);

    const totalPages = Math.ceil(total / limit);

    return {
      data: bookings.map((b, index) =>
        this.mapToSummaryDto(b, showtimeDataArray[index])
      ),
      meta: {
        page,
        limit,
        totalRecords: total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  async findOne(
    id: string,
    userId: string
  ): Promise<ServiceResult<BookingDetailDto>> {
    const booking = await this.prisma.bookings.findFirst({
      where: { id, user_id: userId },
      include: {
        tickets: true,
        booking_concessions: {
          include: {
            concession: true,
          },
        },
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    // Fetch showtime data for enrichment
    let showtimeData;
    try {
      showtimeData = await this.getShowtimeDetails(booking.showtime_id, userId);
    } catch {
      // If showtime data not available, continue without it
      showtimeData = null;
    }

    // Fetch refund voucher code if booking is REFUNDED
    let refundVoucherCode: string | undefined;
    if (booking.status === BookingStatus.REFUNDED) {
      try {
        const refundPromotion = await this.prisma.promotions.findFirst({
          where: {
            conditions: {
              path: ['originalBookingId'],
              equals: id,
            },
          },
        });
        if (refundPromotion) {
          refundVoucherCode = refundPromotion.code;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to fetch refund voucher for booking ${id}`,
          error
        );
      }
    }

    const detailDto = this.mapToDetailDto(booking, showtimeData);
    return { data: { ...detailDto, refundVoucherCode } };
  }

  async cancelBooking(
    id: string,
    userId: string,
    reason?: string,
    refundAmount?: number
  ): Promise<ServiceResult<BookingDetailDto>> {
    const booking = await this.prisma.bookings.findFirst({
      where: { id, user_id: userId },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (
      ![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(
        booking.status as BookingStatus
      )
    ) {
      throw new BadRequestException('Cannot cancel this booking');
    }

    const updated = await this.prisma.bookings.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelled_at: new Date(),
        cancellation_reason: reason,
      },
      include: {
        tickets: true,
        booking_concessions: {
          include: {
            concession: true,
          },
        },
      },
    });

    // Fetch showtime data for enrichment
    let showtimeData;
    try {
      showtimeData = await this.getShowtimeDetails(updated.showtime_id, userId);
    } catch {
      showtimeData = null;
    }

    // Send cancellation email
    this.sendCancellationEmail(updated, showtimeData, refundAmount);

    return {
      data: this.mapToDetailDto(updated, showtimeData),
      message: 'Booking cancelled successfully',
    };
  }

  // Define private helper to send cancellation email
  private async sendCancellationEmail(
    booking: any, // or BookingWithRelations
    showtimeData: ShowtimeSeatResponse | null,
    refundAmount?: number
  ) {
    if (!showtimeData || !showtimeData.showtime) return;

    try {
      const emailBookingDto: any = {
        bookingCode: booking.booking_code,
        movieTitle: showtimeData.showtime.movieTitle,
        cinemaName: showtimeData.cinemaName,
        hallName: showtimeData.hallName,
        startTime: new Date(showtimeData.showtime.start_time),
        endTime: new Date(showtimeData.showtime.end_time),
        customerEmail: booking.customer_email,
        customerName: booking.customer_name,
        cancelledAt: booking.cancelled_at,
        cancellationReason: booking.cancellation_reason,
      };

      await this.notificationService.sendBookingCancellation(
        emailBookingDto,
        refundAmount
      );
    } catch (error) {
      this.logger.error(
        `Failed to send cancellation email for booking ${booking.id}`,
        error
      );
    }
  }

  // Helper methods
  private generateBookingCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BK${timestamp}${random}`;
  }

  private generateTicketCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TK${timestamp}${random}`;
  }

  /**
   * Get showtime details with seat information from Cinema Service
   */
  private async getShowtimeDetails(
    showtimeId: string,
    userId?: string
  ): Promise<ShowtimeSeatResponse> {
    try {
      const showtimeData = await firstValueFrom(
        this.cinemaClient.send(CinemaMessage.SHOWTIME.GET_SHOWTIME_SEATS, {
          showtimeId,
          userId,
        })
      );
      return showtimeData as ShowtimeSeatResponse;
    } catch {
      throw new BadRequestException(
        'Failed to get showtime details from cinema service'
      );
    }
  }

  /**
   * Get concession details from database
   */
  private async getConcessionDetails(
    concessionIds: string[]
  ): Promise<Concessions[]> {
    return this.prisma.concessions.findMany({
      where: {
        id: { in: concessionIds },
      },
    });
  }

  /**
   * Calculate ticket prices based on seat types
   * ✅ Get prices from Cinema Service (SeatPricingDto already has pricing by seat_type)
   */
  private async calculateTicketPrices(
    heldSeatsDetails: SeatDetail[],
    heldSeatsWithPricing: SeatPricingDto[]
  ): Promise<Array<{ seatId: string; price: number }>> {
    const ticketPrices: Array<{ seatId: string; price: number }> = [];

    // Create a map of pricing by seat ID from SeatPricingDto
    const priceMap = new Map(heldSeatsWithPricing.map((s) => [s.id, s.price]));

    for (const seat of heldSeatsDetails) {
      // Get price from SeatPricingDto (based on seat_type and day_type)
      const price = priceMap.get(seat.id) || 0;

      ticketPrices.push({
        seatId: seat.id,
        price,
      });
    }

    return ticketPrices;
  }

  /**
   * Calculate promotion discount
   */
  private async calculatePromotion(
    promotionCode: string,
    subtotal: number
  ): Promise<number> {
    const promotion = await this.prisma.promotions.findFirst({
      where: {
        code: promotionCode,
        active: true,
        valid_from: { lte: new Date() },
        valid_to: { gte: new Date() },
      },
    });

    if (!promotion) {
      throw new BadRequestException('Invalid or expired promotion code');
    }

    // Check usage limits
    if (
      promotion.usage_limit &&
      promotion.current_usage >= promotion.usage_limit
    ) {
      throw new BadRequestException('Promotion code usage limit reached');
    }

    // Check minimum purchase
    if (promotion.min_purchase && subtotal < Number(promotion.min_purchase)) {
      throw new BadRequestException(
        `Minimum purchase of ${promotion.min_purchase} required for this promotion`
      );
    }

    let discount = 0;

    if (promotion.type === PromotionType.PERCENTAGE) {
      discount = (subtotal * Number(promotion.value)) / 100;
      if (promotion.max_discount) {
        discount = Math.min(discount, Number(promotion.max_discount));
      }
    } else if (promotion.type === PromotionType.FIXED_AMOUNT) {
      discount = Number(promotion.value);
    }

    return Math.min(discount, subtotal);
  }

  /**
   * Calculate loyalty points discount
   */
  private async calculatePointsDiscount(
    points: number,
    userId: string
  ): Promise<number> {
    // Check if user has enough points
    const loyaltyAccount = await this.prisma.loyaltyAccounts.findUnique({
      where: { user_id: userId },
    });

    if (!loyaltyAccount) {
      throw new BadRequestException('User does not have a loyalty account');
    }

    if (loyaltyAccount.current_points < points) {
      throw new BadRequestException(
        `Insufficient points. Available: ${loyaltyAccount.current_points}, Requested: ${points}`
      );
    }

    // 1 point = 1000 VND
    return points * 1000;
  }

  private mapToSummaryDto(
    booking: BookingWithRelations,
    showtimeData?: ShowtimeSeatResponse
  ): BookingSummaryDto {
    return {
      id: booking.id,
      bookingCode: booking.booking_code,
      showtimeId: booking.showtime_id,
      movieTitle: showtimeData?.showtime?.movieTitle || 'Movie',
      cinemaName: showtimeData?.cinemaName || 'Cinema',
      hallName: showtimeData?.hallName || 'Hall',
      startTime: showtimeData?.showtime?.start_time || new Date(),
      seatCount: booking.tickets?.length || 0,
      totalAmount: Number(booking.final_amount),
      status: booking.status as BookingStatus,
      createdAt: booking.created_at,
    };
  }

  private mapToDetailDto(
    booking: BookingWithRelations,
    showtimeData?: ShowtimeSeatResponse
  ): BookingDetailDto {
    // Create a map of seat details from showtime data
    // Cinema service always returns seat_map, not seats
    const seatsArray: SeatDetail[] = showtimeData?.seat_map
      ? showtimeData.seat_map.flatMap((row: SeatRowDto) =>
          (row.seats || []).map((s: SeatItemDto) => ({
            ...s,
            row: row.row, // Preserve row from parent
            type: s.seatType || s.seatType,
          }))
        )
      : [];

    const seatMap = new Map(
      (seatsArray || []).map((s: SeatDetail) => [s.id, s])
    );

    return {
      ...this.mapToSummaryDto(booking, showtimeData),
      userId: booking.user_id,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone,
      seats: (booking.tickets || []).map((t: Tickets) => {
        const seatDetail = seatMap.get(t.seat_id);
        return {
          seatId: t.seat_id,
          row: seatDetail?.row || 'A',
          number: seatDetail?.number || 1,
          seatType: seatDetail?.type || 'STANDARD',
          ticketType: t.ticket_type,
          price: Number(t.price),
        };
      }),
      concessions: (booking.booking_concessions || []).map((bc) => ({
        concessionId: bc.concession_id,
        name: bc.concession?.name || '',
        quantity: bc.quantity,
        unitPrice: Number(bc.unit_price),
        totalPrice: Number(bc.total_price),
      })),
      subtotal: Number(booking.subtotal),
      discount: Number(booking.discount),
      pointsUsed: booking.points_used,
      pointsDiscount: Number(booking.points_discount),
      finalAmount: Number(booking.final_amount),
      promotionCode: booking.promotion_code,
      paymentStatus: booking.payment_status as PaymentStatus,
      expiresAt: booking.expires_at,
      cancelledAt: booking.cancelled_at,
      cancellationReason: booking.cancellation_reason,
      updatedAt: booking.updated_at,
    };
  }

  /**
   * ✅ Get ghế đang được giữ bởi user từ cinema service
   * Trả về SeatPricingWithTtlDto với thông tin ghế, giá, và TTL còn lại
   */
  private async getSeatsHeldByUser(
    showtimeId: string,
    userId: string
  ): Promise<SeatPricingWithTtlDto> {
    try {
      const heldSeatsData = await firstValueFrom(
        this.cinemaClient.send(CinemaMessage.SHOWTIME.GET_SEATS_HELD_BY_USER, {
          showtimeId,
          userId,
        })
      );
      return heldSeatsData as SeatPricingWithTtlDto;
    } catch {
      throw new BadRequestException(
        'Failed to get held seats from cinema service. Please try again.'
      );
    }
  }

  /**
   * ✅ Get detailed booking summary with grouped information
   * Transforms existing booking data into BookingCalculationDto format
   * This shows complete breakdown of tickets, concessions, pricing, taxes, and discounts
   */
  async getBookingSummary(
    bookingId: string,
    userId: string
  ): Promise<ServiceResult<BookingCalculationDto>> {
    // Get complete booking details
    const booking = await this.prisma.bookings.findFirst({
      where: { id: bookingId, user_id: userId },
      include: {
        tickets: true,
        booking_concessions: {
          include: {
            concession: true,
          },
        },
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    // Fetch showtime data for movie/cinema information
    let showtimeData;
    try {
      showtimeData = await this.getShowtimeDetails(booking.showtime_id, userId);
    } catch {
      showtimeData = null;
    }

    // Get seat details from showtime data
    // Cinema service returns seat_map (array of SeatRowDto)
    const seatsArray: SeatDetail[] = showtimeData?.seat_map
      ? showtimeData.seat_map.flatMap((row: SeatRowDto) =>
          (row.seats || []).map((s: SeatItemDto) => ({
            ...s,
            row: row.row, // Preserve row from parent
            type: s.seatType, // Use seatType from SeatItemDto
          }))
        )
      : [];

    const seatMap = new Map(
      (seatsArray || []).map((s: SeatDetail) => [s.id, s])
    );

    // Group tickets by ticket type
    const ticketGroups = this.groupTicketsByType(booking.tickets, seatMap);

    // Calculate ticket subtotal
    const ticketsSubtotal = ticketGroups.reduce(
      (sum, g) => sum + g.subtotal,
      0
    );

    // Format concessions
    const concessions = (booking.booking_concessions || []).map((bc) => ({
      concessionId: bc.concession_id,
      name: bc.concession?.name || 'Concession',
      quantity: bc.quantity,
      unitPrice: Number(bc.unit_price),
      totalPrice: Number(bc.total_price),
    }));

    const concessionsSubtotal = concessions.reduce(
      (sum, c) => sum + c.totalPrice,
      0
    );

    // Calculate pricing breakdown
    const subtotal = Number(booking.subtotal);
    const totalDiscount =
      Number(booking.discount) + Number(booking.points_discount);

    // Calculate tax (reverse calculation from final amount)
    const totalBeforeTax = subtotal - totalDiscount;
    const VAT_RATE = 10;
    const vatAmount = Math.round((totalBeforeTax * VAT_RATE) / 100);

    // Build promotion discount info
    const promotionDiscount = booking.promotion_code
      ? {
          code: booking.promotion_code,
          description: `Promotion code: ${booking.promotion_code}`,
          discountAmount: Number(booking.discount),
        }
      : undefined;

    // Build loyalty points discount info
    const loyaltyPointsDiscount =
      booking.points_used > 0
        ? {
            pointsUsed: booking.points_used,
            discountAmount: Number(booking.points_discount),
          }
        : undefined;

    // Get loyalty points information
    let loyaltyPoints;
    if (booking.points_used > 0) {
      try {
        const loyaltyAccount = await this.prisma.loyaltyAccounts.findUnique({
          where: { user_id: userId },
        });

        if (loyaltyAccount) {
          // Calculate points earned from this booking (1 point per 1000 VND)
          const pointsEarned = Math.floor(Number(booking.final_amount) / 1000);

          loyaltyPoints = {
            used: booking.points_used,
            willEarn: pointsEarned,
            currentBalance: loyaltyAccount.current_points,
            newBalance:
              loyaltyAccount.current_points -
              booking.points_used +
              pointsEarned,
          };
        }
      } catch {
        // If loyalty account not available, skip
      }
    }

    // Get available payment information (only pending payment)
    let paymentInfo;
    try {
      const pendingPayment = await this.prisma.payments.findFirst({
        where: {
          booking_id: booking.id,
          status: PaymentStatus.PENDING,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (pendingPayment) {
        paymentInfo = {
          id: pendingPayment.id,
          amount: Number(pendingPayment.amount),
          paymentMethod: pendingPayment.payment_method,
          paymentUrl: pendingPayment.payment_url || undefined,
          status: pendingPayment.status,
          createdAt: pendingPayment.created_at,
        };
      }
    } catch {
      // If payment not available, skip
    }

    // Build the summary
    const summary: BookingCalculationDto = {
      bookingId: booking.id,
      movie: {
        id: showtimeData?.showtime?.movieId || '',
        title: showtimeData?.showtime?.movieTitle || 'Movie',
        posterUrl: undefined,
        duration: 0,
        rating: 'N/A',
      },
      cinema: {
        id: showtimeData?.cinemaId || '',
        name: showtimeData?.cinemaName || 'Cinema',
        address: '',
        hallName: showtimeData?.hallName || 'Hall',
      },
      showtime: {
        id: booking.showtime_id,
        startTime: showtimeData?.showtime?.start_time || new Date(),
        endTime: showtimeData?.showtime?.end_time || new Date(),
        format: showtimeData?.showtime?.format || FormatEnum.TWO_D,
        language: showtimeData?.showtime?.language || 'Vietnamese',
      },
      ticketGroups,
      concessions,
      pricing: {
        ticketsSubtotal,
        concessionsSubtotal,
        subtotal,
        tax: {
          vatRate: VAT_RATE,
          vatAmount,
        },
        promotionDiscount,
        loyaltyPointsDiscount,
        totalDiscount,
        totalBeforeTax,
        finalAmount: Number(booking.final_amount),
      },
      loyaltyPoints,
      payment: paymentInfo,
      bookingCode: booking.booking_code,
      status: booking.status as BookingStatus,
      paymentStatus: booking.payment_status as PaymentStatus,
      expiresAt: booking.expires_at,
    };

    return { data: summary };
  }

  /**
   * Helper: Group tickets by ticket type
   */
  private groupTicketsByType(
    tickets: Array<{
      seat_id: string;
      ticket_type: string;
      price: unknown;
    }>,
    seatMap: Map<string, SeatDetail>
  ) {
    const groups: Record<
      string,
      {
        ticketType: string;
        quantity: number;
        pricePerTicket: number;
        subtotal: number;
        seats: Array<{
          seatId: string;
          row: string;
          number: number;
          seatType: string;
        }>;
      }
    > = {};

    for (const ticket of tickets) {
      const ticketType = ticket.ticket_type;
      const price = Number(ticket.price);
      const seat = seatMap.get(ticket.seat_id);

      if (!groups[ticketType]) {
        groups[ticketType] = {
          ticketType,
          quantity: 0,
          pricePerTicket: price,
          subtotal: 0,
          seats: [],
        };
      }

      groups[ticketType].quantity++;
      groups[ticketType].subtotal += price;
      groups[ticketType].seats.push({
        seatId: ticket.seat_id,
        row: (seat?.row as string) || 'A',
        number: (seat?.number as number) || 1,
        seatType: (seat?.type as string) || 'STANDARD',
      });
    }

    return Object.values(groups);
  }

  // ==================== ADMIN OPERATIONS ====================

  /**
   * Admin: Find all bookings with comprehensive filters
   */
  async adminFindAllBookings(
    filters: AdminFindAllBookingsDto & { cinemaId?: string } = {}
  ): Promise<ServiceResult<BookingSummaryDto[]>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingsWhereInput = {};

    if (filters?.userId) where.user_id = filters.userId;
    if (filters?.showtimeId) where.showtime_id = filters.showtimeId;
    if (filters?.status) where.status = filters.status;
    if (filters?.paymentStatus) where.payment_status = filters.paymentStatus;

    if (filters?.cinemaId) {
      const showtimeIds = await this.getShowtimeIdsForCinema(filters.cinemaId);
      if (showtimeIds.length === 0) {
        // No showtimes for this cinema -> No bookings
        return {
          data: [],
          meta: {
            page,
            limit,
            totalRecords: 0,
            totalPages: 0,
            hasPrev: false,
            hasNext: false,
          },
        };
      }
      // If filtering by showtimeId AND cinemaId, ensure intersection (or just prioritize cinemaId list check)
      if (where.showtime_id) {
        // Trying to specific showtime which must belong to cinema
        if (!showtimeIds.includes(where.showtime_id as string)) {
          return {
            data: [],
            meta: {
              page,
              limit,
              totalRecords: 0,
              totalPages: 0,
              hasPrev: false,
              hasNext: false,
            },
          };
        }
      } else {
        where.showtime_id = { in: showtimeIds };
      }
    }

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = filters.startDate;
      if (filters.endDate) where.created_at.lte = filters.endDate;
    }

    const orderBy: Prisma.BookingsOrderByWithRelationInput = {};
    const sortBy = filters?.sortBy || 'created_at';
    const sortOrder = filters?.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const [bookings, total] = await Promise.all([
      this.prisma.bookings.findMany({
        where,
        include: {
          tickets: true,
          booking_concessions: {
            include: {
              concession: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.bookings.count({ where }),
    ]);

    // Fetch showtime data for all bookings
    const showtimePromises = bookings.map(async (booking) => {
      try {
        return await this.getShowtimeDetails(booking.showtime_id);
      } catch {
        return null;
      }
    });

    const showtimeDataArray = await Promise.all(showtimePromises);

    const totalPages = Math.ceil(total / limit);

    return {
      data: bookings.map((b, index) =>
        this.mapToSummaryDto(b, showtimeDataArray[index])
      ),
      meta: {
        page,
        limit,
        totalRecords: total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  /**
   * Find all bookings for a specific showtime
   */
  async findBookingsByShowtime(
    showtimeId: string,
    status?: BookingStatus
  ): Promise<ServiceResult<BookingSummaryDto[]>> {
    const where: Prisma.BookingsWhereInput = { showtime_id: showtimeId };
    if (status) where.status = status;

    const bookings = await this.prisma.bookings.findMany({
      where,
      include: {
        tickets: true,
        booking_concessions: {
          include: {
            concession: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Get showtime data once (same for all bookings)
    let showtimeData;
    try {
      showtimeData = await this.getShowtimeDetails(showtimeId);
    } catch {
      showtimeData = null;
    }

    return { data: bookings.map((b) => this.mapToSummaryDto(b, showtimeData)) };
  }

  /**
   * Find bookings by date range
   */
  async findBookingsByDateRange(
    filters: {
      startDate?: Date;
      endDate?: Date;
      status?: BookingStatus;
      page?: number;
      limit?: number;
      cinemaId?: string;
    } = {}
  ): Promise<ServiceResult<BookingSummaryDto[]>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingsWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = filters.startDate;
      if (filters.endDate) where.created_at.lte = filters.endDate;
    }

    if (filters?.cinemaId) {
      const showtimeIds = await this.getShowtimeIdsForCinema(filters.cinemaId);
      if (showtimeIds.length === 0) {
        return {
          data: [],
          meta: {
            page,
            limit,
            totalRecords: 0,
            totalPages: 0,
            hasPrev: false,
            hasNext: false,
          },
        };
      }
      where.showtime_id = { in: showtimeIds };
    }

    if (filters?.status) where.status = filters.status;

    const [bookings, total] = await Promise.all([
      this.prisma.bookings.findMany({
        where,
        include: {
          tickets: true,
          booking_concessions: {
            include: {
              concession: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bookings.count({ where }),
    ]);

    // Fetch showtime data for all bookings
    const showtimePromises = bookings.map(async (booking) => {
      try {
        return await this.getShowtimeDetails(booking.showtime_id);
      } catch {
        return null;
      }
    });

    const showtimeDataArray = await Promise.all(showtimePromises);

    const totalPages = Math.ceil(total / limit);

    return {
      data: bookings.map((b, index) =>
        this.mapToSummaryDto(b, showtimeDataArray[index])
      ),
      meta: {
        page,
        limit,
        totalRecords: total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  /**
   * Admin: Update booking status
   */
  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    reason?: string
  ): Promise<ServiceResult<BookingDetailDto>> {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    const data: Prisma.BookingsUpdateInput = { status };

    if (status === BookingStatus.CANCELLED) {
      data.cancelled_at = new Date();
      data.cancellation_reason = reason;
    }

    const updated = await this.prisma.bookings.update({
      where: { id: bookingId },
      data,
      include: {
        tickets: true,
        booking_concessions: {
          include: {
            concession: true,
          },
        },
      },
    });

    // Fetch showtime data
    let showtimeData;
    try {
      showtimeData = await this.getShowtimeDetails(updated.showtime_id);
    } catch {
      showtimeData = null;
    }

    return {
      data: this.mapToDetailDto(updated, showtimeData),
      message: `Booking status updated to ${status}`,
    };
  }

  /**
   * Confirm booking (after successful payment)
   */
  async confirmBooking(
    bookingId: string
  ): Promise<ServiceResult<BookingDetailDto>> {
    return this.updateBookingStatus(bookingId, BookingStatus.CONFIRMED);
  }

  /**
   * Complete booking (after showtime ends)
   */
  async completeBooking(
    bookingId: string
  ): Promise<ServiceResult<BookingDetailDto>> {
    return this.updateBookingStatus(bookingId, BookingStatus.COMPLETED);
  }

  /**
   * Expire booking (auto-expiration of pending bookings)
   */
  async expireBooking(
    bookingId: string
  ): Promise<ServiceResult<BookingDetailDto>> {
    return this.updateBookingStatus(
      bookingId,
      BookingStatus.EXPIRED,
      'Payment timeout'
    );
  }

  // ==================== STATISTICS & REPORTS ====================

  /**
   * Get comprehensive booking statistics
   */
  async getBookingStatistics(
    filters: {
      startDate?: Date;
      endDate?: Date;
      cinemaId?: string;
      showtimeId?: string;
    } = {}
  ): Promise<any> {
    console.log(
      `[BookingService] getBookingStatistics called with filters:`,
      filters
    );
    const where: Prisma.BookingsWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = filters.startDate;
      if (filters.endDate) where.created_at.lte = filters.endDate;
    }

    if (filters?.showtimeId) where.showtime_id = filters.showtimeId;

    const bookings = await this.prisma.bookings.findMany({
      where: {
        ...where,
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
        },
      },
      include: {
        tickets: true,
        booking_concessions: {
          include: {
            concession: true,
          },
        },
      },
    });

    console.log(
      `[BookingService] Found ${bookings.length} raw bookings in DB.`
    );

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + Number(b.final_amount),
      0
    );
    const averageBookingValue =
      totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Group by status
    const bookingsByStatus = Object.values(BookingStatus).map((status) => {
      const statusBookings = bookings.filter((b) => b.status === status);
      return {
        status,
        count: statusBookings.length,
        revenue: statusBookings.reduce(
          (sum, b) => sum + Number(b.final_amount),
          0
        ),
      };
    });

    // Group by payment status
    const bookingsByPaymentStatus = Object.values(PaymentStatus).map(
      (status) => {
        const count = bookings.filter(
          (b) => b.payment_status === status
        ).length;
        return { status, count };
      }
    );

    // Top concessions
    const concessionStats = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    bookings.forEach((booking) => {
      booking.booking_concessions?.forEach((bc) => {
        const key = bc.concession_id;
        if (!concessionStats.has(key)) {
          concessionStats.set(key, {
            name: bc.concession?.name || 'Unknown',
            quantity: 0,
            revenue: 0,
          });
        }
        const stats = concessionStats.get(key)!;
        stats.quantity += bc.quantity;
        stats.revenue += Number(bc.total_price);
      });
    });

    const topConcessions = Array.from(concessionStats.entries())
      .map(([concessionId, stats]) => ({ concessionId, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top promotions
    const promotionStats = new Map<
      string,
      { usageCount: number; totalDiscount: number }
    >();

    bookings.forEach((booking) => {
      if (booking.promotion_code) {
        if (!promotionStats.has(booking.promotion_code)) {
          promotionStats.set(booking.promotion_code, {
            usageCount: 0,
            totalDiscount: 0,
          });
        }
        const stats = promotionStats.get(booking.promotion_code)!;
        stats.usageCount++;
        stats.totalDiscount += Number(booking.discount);
      }
    });

    const topPromotions = Array.from(promotionStats.entries())
      .map(([code, stats]) => ({ code, ...stats }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    return {
      data: {
        totalBookings,
        totalRevenue,
        averageBookingValue,
        bookingsByStatus,
        bookingsByPaymentStatus,
        topConcessions,
        topPromotions,
        period:
          filters.startDate && filters.endDate
            ? {
                startDate: filters.startDate,
                endDate: filters.endDate,
              }
            : undefined,
      },
    };
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(
    filters: {
      startDate?: Date;
      endDate?: Date;
      cinemaId?: string;
      groupBy?: 'day' | 'week' | 'month' | 'cinema';
    } = {}
  ): Promise<any> {
    const where: Prisma.BookingsWhereInput = {
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] }, // Include confirmed and completed bookings
    };

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = filters.startDate;
      if (filters.endDate) where.created_at.lte = filters.endDate;
    }

    if (filters?.cinemaId) {
      // Would need cinema_id in bookings table or join through showtime
      // For now, we'll skip this filter
    }

    const bookings = await this.prisma.bookings.findMany({
      where,
      include: {
        tickets: true,
        booking_concessions: {
          include: {
            concession: true,
          },
        },
      },
    });

    // Calculate totals
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + Number(b.final_amount),
      0
    );

    const totalTicketRevenue = bookings.reduce((sum, b) => {
      const ticketTotal =
        b.tickets?.reduce((tSum, t) => tSum + Number(t.price), 0) || 0;
      return sum + ticketTotal;
    }, 0);

    const totalConcessionRevenue = bookings.reduce((sum, b) => {
      const concessionTotal =
        b.booking_concessions?.reduce(
          (cSum, bc) => cSum + Number(bc.total_price),
          0
        ) || 0;
      return sum + concessionTotal;
    }, 0);

    const totalDiscount = bookings.reduce(
      (sum, b) => sum + Number(b.discount) + Number(b.points_discount),
      0
    );

    // Get refund amount
    const refunds = await this.prisma.refunds.findMany({
      where: {
        status: 'COMPLETED',
        created_at: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
    });

    const totalRefund = refunds.reduce((sum, r) => sum + Number(r.amount), 0);

    const netRevenue = totalRevenue - totalRefund;
    const bookingCount = bookings.length;
    const averageBookingValue =
      bookingCount > 0 ? totalRevenue / bookingCount : 0;

    // Revenue by period (simplified - just daily for now)
    const revenueByPeriod: any[] = [];

    if (filters.groupBy === 'day' || !filters.groupBy) {
      const dateMap = new Map<string, { revenue: number; count: number }>();

      bookings.forEach((booking) => {
        const date = booking.created_at.toISOString().split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, { revenue: 0, count: 0 });
        }
        const stats = dateMap.get(date)!;
        stats.revenue += Number(booking.final_amount);
        stats.count++;
      });

      dateMap.forEach((stats, date) => {
        revenueByPeriod.push({
          period: date,
          revenue: stats.revenue,
          bookingCount: stats.count,
        });
      });

      revenueByPeriod.sort((a, b) => a.period.localeCompare(b.period));
    }

    return {
      data: {
        totalRevenue,
        totalTicketRevenue,
        totalConcessionRevenue,
        totalDiscount,
        totalRefund,
        netRevenue,
        bookingCount,
        averageBookingValue,
        revenueByPeriod,
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      },
    };
  }

  /**
   * Get revenue grouped by movie ID (for dashboard)
   * Fetches showtime details to get movieId, then aggregates
   */
  async getRevenueGroupedByMovieId(
    filters: {
      startDate?: Date;
      endDate?: Date;
      cinemaId?: string;
    } = {}
  ): Promise<Array<{ movieId: string; revenue: number; bookings: number }>> {
    const where: Prisma.BookingsWhereInput = {
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
    };

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = filters.startDate;
      if (filters.endDate) where.created_at.lte = filters.endDate;
    }

    const bookings = await this.prisma.bookings.findMany({
      where,
      select: {
        showtime_id: true,
        final_amount: true,
      },
    });

    if (bookings.length === 0) {
      return [];
    }

    // Get unique showtime IDs
    const showtimeIds = [...new Set(bookings.map((b) => b.showtime_id))];

    // 🚀 Batch fetch showtime details from Cinema service (single RPC call instead of N+1)
    const showtimeMap = new Map<
      string,
      { movieId: string; cinemaId: string }
    >();

    try {
      const showtimeResult = await firstValueFrom(
        this.cinemaClient.send(CinemaMessage.SHOWTIME.GET_SHOWTIMES_BY_IDS, {
          showtimeIds,
        })
      );
      const showtimes = showtimeResult?.data || [];
      for (const st of showtimes) {
        if (st.movieId) {
          showtimeMap.set(st.showtimeId, {
            movieId: st.movieId,
            cinemaId: st.cinemaId,
          });
        }
      }
    } catch (error) {
      this.logger.warn(
        'Failed to batch fetch showtimes for movie aggregation',
        error
      );
    }

    // Aggregate by movieId
    const movieStats = new Map<string, { revenue: number; bookings: number }>();

    for (const booking of bookings) {
      const showtime = showtimeMap.get(booking.showtime_id);
      if (!showtime) continue;

      // Filter by cinemaId if provided
      if (filters.cinemaId && showtime.cinemaId !== filters.cinemaId) {
        continue;
      }

      const movieId = showtime.movieId;

      if (!movieStats.has(movieId)) {
        movieStats.set(movieId, { revenue: 0, bookings: 0 });
      }
      const stats = movieStats.get(movieId);
      if (stats) {
        stats.revenue += Number(booking.final_amount);
        stats.bookings++;
      }
    }

    // Convert to array and sort by revenue descending
    return Array.from(movieStats.entries())
      .map(([movieId, stats]) => ({
        movieId,
        revenue: stats.revenue,
        bookings: stats.bookings,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Get revenue grouped by cinema ID (for dashboard)
   * Fetches showtime details to get cinemaId, then aggregates
   * Also calculates occupancy rate using hall capacities
   */
  async getRevenueGroupedByCinemaId(
    filters: {
      startDate?: Date;
      endDate?: Date;
      cinemaId?: string;
    } = {}
  ): Promise<
    Array<{
      cinemaId: string;
      revenue: number;
      bookings: number;
      occupancyRate: number;
    }>
  > {
    const where: Prisma.BookingsWhereInput = {
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
    };

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = filters.startDate;
      if (filters.endDate) where.created_at.lte = filters.endDate;
    }

    // Fetch bookings with ticket count for occupancy calculation
    const bookings = await this.prisma.bookings.findMany({
      where,
      select: {
        showtime_id: true,
        final_amount: true,
        tickets: {
          select: { id: true },
        },
      },
    });

    if (bookings.length === 0) {
      return [];
    }

    // Get unique showtime IDs
    const showtimeIds = [...new Set(bookings.map((b) => b.showtime_id))];

    // 🚀 Batch fetch showtime details from Cinema service (single RPC call instead of N+1)
    const showtimeMap = new Map<string, string>(); // showtimeId -> cinemaId

    try {
      const showtimeResult = await firstValueFrom(
        this.cinemaClient.send(CinemaMessage.SHOWTIME.GET_SHOWTIMES_BY_IDS, {
          showtimeIds,
        })
      );
      const showtimes = showtimeResult?.data || [];
      for (const st of showtimes) {
        if (st.cinemaId) {
          showtimeMap.set(st.showtimeId, st.cinemaId);
        }
      }
    } catch (error) {
      this.logger.warn(
        'Failed to batch fetch showtimes for cinema aggregation',
        error
      );
    }

    // Fetch hall capacities for occupancy calculation
    const capacityMap = new Map<string, number>(); // cinemaId -> total capacity
    try {
      const capacitiesResult = await firstValueFrom(
        this.cinemaClient.send(CinemaMessage.HALL.GET_HALL_CAPACITIES, {})
      );
      const capacities = capacitiesResult?.data || capacitiesResult || [];
      for (const cap of capacities) {
        if (cap.cinemaId) {
          const current = capacityMap.get(cap.cinemaId) || 0;
          capacityMap.set(cap.cinemaId, current + (cap.capacity || 0));
        }
      }
    } catch (error) {
      this.logger.warn(
        'Failed to fetch hall capacities for occupancy calculation',
        error
      );
    }

    // Aggregate by cinemaId
    const cinemaStats = new Map<
      string,
      { revenue: number; bookings: number; soldSeats: number }
    >();

    for (const booking of bookings) {
      const cinemaId = showtimeMap.get(booking.showtime_id);
      if (!cinemaId) continue;

      // Filter by cinemaId if provided
      if (filters.cinemaId && cinemaId !== filters.cinemaId) {
        continue;
      }

      if (!cinemaStats.has(cinemaId)) {
        cinemaStats.set(cinemaId, { revenue: 0, bookings: 0, soldSeats: 0 });
      }
      const stats = cinemaStats.get(cinemaId);
      if (stats) {
        stats.revenue += Number(booking.final_amount);
        stats.bookings++;
        stats.soldSeats += booking.tickets?.length || 0;
      }
    }

    // Convert to array and sort by revenue descending
    return Array.from(cinemaStats.entries())
      .map(([cinemaId, stats]) => {
        const totalCapacity = capacityMap.get(cinemaId) || 0;
        const occupancyRate =
          totalCapacity > 0
            ? Math.round((stats.soldSeats / totalCapacity) * 100)
            : 0;
        return {
          cinemaId,
          revenue: stats.revenue,
          bookings: stats.bookings,
          occupancyRate,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }

  // ==================== NEW FEATURES ====================

  /**
   * Calculate refund amount based on cancellation policy
   * Policy: Cancel before 2 hours → 70% refund on tickets only
   */
  async calculateRefund(
    bookingId: string,
    userId: string
  ): Promise<ServiceResult<RefundCalculationDto>> {
    const booking = await this.prisma.bookings.findFirst({
      where: { id: bookingId, user_id: userId },
      include: {
        tickets: true,
        booking_concessions: true,
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    // Get showtime details to check timing
    let showtimeData;
    try {
      showtimeData = await this.getShowtimeDetails(booking.showtime_id, userId);
    } catch {
      throw new BadRequestException('Cannot fetch showtime information');
    }

    const showtimeStart = new Date(showtimeData.showtime.start_time);
    const now = new Date();
    const hoursUntilShowtime =
      (showtimeStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Check if booking can be cancelled
    if (hoursUntilShowtime < this.CANCELLATION_HOURS_BEFORE) {
      return {
        data: {
          canRefund: false,
          refundAmount: 0,
          refundPercentage: 0,
          ticketAmount: 0,
          concessionsAmount: 0,
          reason: `Cancellation must be made at least ${this.CANCELLATION_HOURS_BEFORE} hours before showtime`,
          deadline: new Date(
            showtimeStart.getTime() -
              this.CANCELLATION_HOURS_BEFORE * 60 * 60 * 1000
          ),
        },
      };
    }

    // Check if already cancelled or refunded
    if (booking.status === BookingStatus.CANCELLED) {
      return {
        data: {
          canRefund: false,
          refundAmount: 0,
          refundPercentage: 0,
          ticketAmount: 0,
          concessionsAmount: 0,
          reason: 'Booking is already cancelled',
        },
      };
    }

    // Calculate ticket amount (from actual tickets, not subtotal)
    const ticketAmount =
      booking.tickets?.reduce((sum, t) => sum + Number(t.price), 0) || 0;

    // Concessions are NOT refundable
    const concessionsAmount =
      booking.booking_concessions?.reduce(
        (sum, bc) => sum + Number(bc.total_price),
        0
      ) || 0;

    // Calculate refund: 70% of ticket price only
    const refundAmount = Math.round(
      (ticketAmount * this.REFUND_PERCENTAGE) / 100
    );

    return {
      data: {
        canRefund: true,
        refundAmount,
        refundPercentage: this.REFUND_PERCENTAGE,
        ticketAmount,
        concessionsAmount,
        reason: `Refund ${this.REFUND_PERCENTAGE}% of ticket price. Concessions are non-refundable.`,
        deadline: new Date(
          showtimeStart.getTime() -
            this.CANCELLATION_HOURS_BEFORE * 60 * 60 * 1000
        ),
      },
    };
  }

  /**
   * Cancel booking with refund policy validation
   */
  async cancelBookingWithRefund(
    id: string,
    userId: string,
    dto: CancelBookingWithRefundDto
  ): Promise<
    ServiceResult<{ booking: BookingDetailDto; refund?: RefundCalculationDto }>
  > {
    // Calculate refund eligibility
    const refundCalcResult = await this.calculateRefund(id, userId);

    // Cancel the booking (email will be sent by cancelBooking)
    const refundAmount =
      dto.requestRefund && refundCalcResult.data.canRefund
        ? refundCalcResult.data.refundAmount
        : undefined;

    const bookingResult = await this.cancelBooking(
      id,
      userId,
      dto.reason,
      refundAmount
    );

    return {
      data: {
        booking: bookingResult.data,
        refund: refundCalcResult.data,
      },
      message: 'Booking cancelled with refund calculation',
    };
  }

  /**
   * Update booking before payment (modify seats, concessions, promotions)
   * Only allowed when status is PENDING and not expired
   */
  async updateBooking(
    id: string,
    userId: string,
    dto: UpdateBookingDto
  ): Promise<ServiceResult<BookingDetailDto>> {
    this.logger.log(`Updating booking ${id} for user ${userId}`);
    const booking = await this.prisma.bookings.findFirst({
      where: { id, user_id: userId },
      include: {
        tickets: true,
        booking_concessions: true,
      },
    });
    this.logger.log(`Booking retrieved: ${booking ? 'found' : 'not found'}`);

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    this.logger.log(
      `Booking status: ${booking.status}, expires at: ${booking.expires_at}`
    );
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Can only update pending bookings');
    }

    // ✅ STEP 1: Handle seats update (the actual booking logic)

    // Get seats currently held by user from Cinema Service (Redis)

    const heldSeatsData = await this.getSeatsHeldByUser(
      booking.showtime_id,
      userId
    );
    const { seats: heldSeatsWithPricing, lockTtl: sessionTTL } = heldSeatsData;
    this.logger.log(
      `Held seats retrieved: ${heldSeatsWithPricing.length} seats, TTL: ${sessionTTL}s`
    );

    if (heldSeatsWithPricing.length === 0) {
      throw new BadRequestException(
        'No seats are currently held by this user. Please hold seats via WebSocket first.'
      );
    }

    // Validate seat lock TTL
    if (sessionTTL <= 0) {
      throw new BadRequestException(
        'Seat lock has expired. Please hold seats again via WebSocket.'
      );
    }

    // Check if any of the held seats already have VALID tickets
    const seatIds = heldSeatsWithPricing.map((seat) => seat.id);
    const existingValidTickets = await this.prisma.tickets.findMany({
      where: {
        seat_id: { in: seatIds },
        booking: {
          showtime_id: booking.showtime_id,
        },
        status: TicketStatus.VALID,
      },
    });

    if (existingValidTickets.length > 0) {
      const bookedSeatIds = existingValidTickets.map((t) => t.seat_id);
      throw new BadRequestException(
        `Cannot update booking. The following seats already have valid tickets: ${bookedSeatIds.join(
          ', '
        )}`
      );
    }

    // Build seat details from held seats
    const heldSeatsDetails: SeatDetail[] = heldSeatsWithPricing.map((seat) => ({
      id: seat.id,
      row: seat.rowLetter,
      number: seat.seatNumber,
      type: seat.type,
      seatType: seat.type,
      seatStatus: SeatStatusEnum.ACTIVE,
      reservationStatus: ReservationStatusEnum.HELD,
      isHeldByCurrentUser: true,
    }));

    // Calculate pricing
    const ticketPrices = await this.calculateTicketPrices(
      heldSeatsDetails,
      heldSeatsWithPricing
    );

    const seatTypeMap = new Map(heldSeatsDetails.map((s) => [s.id, s.type]));

    // Delete existing tickets
    await this.prisma.tickets.deleteMany({
      where: { booking_id: id },
    });

    // Create new tickets with pricing
    const newTickets = ticketPrices.map((ticket) => ({
      booking_id: id,
      seat_id: ticket.seatId,
      ticket_code: this.generateTicketCode(),
      ticket_type: seatTypeMap.get(ticket.seatId) || 'STANDARD',
      price: ticket.price,
      status: TicketStatus.CANCELLED, // Will become VALID after payment
    }));

    await this.prisma.tickets.createMany({
      data: newTickets,
    });

    // Update booking expiration to match seat lock TTL
    await this.prisma.bookings.update({
      where: { id },
      data: {
        expires_at: new Date(Date.now() + sessionTTL * 1000),
      },
    });

    // ✅ STEP 2: Handle concessions update
    if (dto.concessions !== undefined) {
      // Delete existing concessions
      await this.prisma.bookingConcessions.deleteMany({
        where: { booking_id: id },
      });

      if (dto.concessions.length > 0) {
        const concessionData = await this.getConcessionDetails(
          dto.concessions.map((c) => c.concessionId)
        );

        const newConcessions = dto.concessions.map((item) => {
          const concession = concessionData.find(
            (c) => c.id === item.concessionId
          );
          if (!concession) {
            throw new BadRequestException(
              `Concession ${item.concessionId} not found`
            );
          }
          if (!concession.available) {
            throw new BadRequestException(
              `Concession ${concession.name} is not available`
            );
          }

          const totalPrice = Number(concession.price) * item.quantity;
          return {
            booking_id: id,
            concession_id: item.concessionId,
            quantity: item.quantity,
            unit_price: Number(concession.price),
            total_price: totalPrice,
          };
        });

        await this.prisma.bookingConcessions.createMany({
          data: newConcessions,
        });
      }
    }

    // ✅ STEP 3: Recalculate pricing
    const updatedBooking = await this.prisma.bookings.findFirst({
      where: { id },
      include: {
        tickets: true,
        booking_concessions: {
          include: { concession: true },
        },
      },
    });

    if (!updatedBooking) {
      throw new BadRequestException('Failed to retrieve updated booking');
    }

    const ticketsSubtotal =
      updatedBooking.tickets?.reduce((sum, t) => sum + Number(t.price), 0) || 0;
    const concessionsSubtotal =
      updatedBooking.booking_concessions?.reduce(
        (sum, bc) => sum + Number(bc.total_price),
        0
      ) || 0;
    const subtotal = ticketsSubtotal + concessionsSubtotal;

    // ✅ STEP 4: Apply promotions and loyalty points
    let discount = 0;
    let pointsDiscount = 0;

    const promotionCode =
      dto.promotionCode !== undefined
        ? dto.promotionCode
        : booking.promotion_code;
    if (promotionCode) {
      discount = await this.calculatePromotion(promotionCode, subtotal);
    }

    const usePoints =
      dto.usePoints !== undefined ? dto.usePoints : booking.points_used;
    if (usePoints > 0) {
      pointsDiscount = await this.calculatePointsDiscount(usePoints, userId);
    }

    const finalAmount = Math.max(0, subtotal - discount - pointsDiscount);

    // ✅ STEP 5: Update booking amounts
    await this.prisma.bookings.update({
      where: { id },
      data: {
        subtotal,
        discount,
        points_used: usePoints,
        points_discount: pointsDiscount,
        final_amount: finalAmount,
        promotion_code: promotionCode,
        updated_at: new Date(),
      },
    });

    return this.findOne(id, userId);
  }

  /**
   * Reschedule booking to a different showtime
   * Policy: Only 1 reschedule allowed per booking
   */
  async rescheduleBooking(
    id: string,
    userId: string,
    dto: RescheduleBookingDto
  ): Promise<ServiceResult<BookingDetailDto>> {
    const booking = await this.prisma.bookings.findFirst({
      where: { id, user_id: userId },
      include: {
        tickets: true,
      },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot reschedule cancelled booking');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot reschedule completed booking');
    }

    // Check reschedule count (using cancellation_reason as metadata for now)
    // TODO: Add a proper 'reschedule_count' field to schema
    const rescheduleCount = (booking.cancellation_reason || '').includes(
      'Rescheduled'
    )
      ? 1
      : 0;

    if (rescheduleCount >= this.MAX_RESCHEDULES) {
      throw new BadRequestException(
        `Maximum ${this.MAX_RESCHEDULES} reschedule allowed per booking`
      );
    }

    // Get old showtime details
    let oldShowtimeData;
    try {
      oldShowtimeData = await this.getShowtimeDetails(
        booking.showtime_id,
        userId
      );
    } catch {
      throw new BadRequestException(
        'Cannot fetch current showtime information'
      );
    }

    // Validate new showtime
    let newShowtimeData;
    try {
      newShowtimeData = await this.getShowtimeDetails(
        dto.newShowtimeId,
        userId
      );
    } catch {
      throw new BadRequestException('Invalid new showtime');
    }

    // Check timing - cannot reschedule if current showtime is less than 2 hours away
    const oldShowtimeStart = new Date(oldShowtimeData.showtime.start_time);
    const now = new Date();
    const hoursUntilOldShowtime =
      (oldShowtimeStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilOldShowtime < this.CANCELLATION_HOURS_BEFORE) {
      throw new BadRequestException(
        `Cannot reschedule within ${this.CANCELLATION_HOURS_BEFORE} hours of showtime`
      );
    }

    // Save old booking for notification
    const oldBookingDetailResult = await this.findOne(id, userId);

    // Update booking with new showtime
    // Keep same seats (seat IDs might be different in new showtime, needs validation)
    await this.prisma.bookings.update({
      where: { id },
      data: {
        showtime_id: dto.newShowtimeId,
        cancellation_reason:
          rescheduleCount > 0
            ? `Rescheduled ${rescheduleCount + 1} times`
            : 'Rescheduled from previous showtime',
        updated_at: new Date(),
      },
    });

    // TODO: Validate that seat IDs are still valid for new showtime
    // TODO: Calculate price difference if seat pricing is different

    const newBookingDetailResult = await this.findOne(id, userId);

    // Send notification ASYNC (fire-and-forget, don't block reschedule)
    this.notificationService
      .sendBookingReschedule(
        oldBookingDetailResult.data,
        newBookingDetailResult.data
      )
      .catch((error) => {
        console.error(
          '[Booking] Failed to send reschedule email (async):',
          error
        );
      });

    return newBookingDetailResult;
  }

  /**
   * Get cancellation policy information
   */
  getCancellationPolicy(): {
    hoursBeforeShowtime: number;
    refundPercentage: number;
    maxReschedules: number;
    notes: string[];
  } {
    return {
      hoursBeforeShowtime: this.CANCELLATION_HOURS_BEFORE,
      refundPercentage: this.REFUND_PERCENTAGE,
      maxReschedules: this.MAX_RESCHEDULES,
      notes: [
        `Cancellations must be made at least ${this.CANCELLATION_HOURS_BEFORE} hours before showtime`,
        `Refund is ${this.REFUND_PERCENTAGE}% of ticket price only`,
        'Concessions and service fees are non-refundable',
        `Rescheduling is allowed up to ${this.MAX_RESCHEDULES} time per booking`,
        'Price difference may apply when rescheduling',
        'Refunds are processed within 3-7 business days',
      ],
    };
  }

  /**
   * Find user's booking at a specific showtime
   * Used when entering showtime screen to check if user already has a booking
   * Returns BookingCalculationDto if found, null if not found
   */
  async findUserBookingByShowtime(
    showtimeId: string,
    userId: string,
    includeStatuses?: BookingStatus[]
  ): Promise<ServiceResult<BookingCalculationDto | null>> {
    const statusFilter =
      includeStatuses && includeStatuses.length > 0
        ? { in: includeStatuses }
        : BookingStatus.PENDING; // Default: only PENDING bookings

    const booking = await this.prisma.bookings.findFirst({
      where: {
        user_id: userId,
        showtime_id: showtimeId,
        status: statusFilter,
      },
      orderBy: {
        created_at: 'desc', // Get most recent booking if multiple exist
      },
    });

    if (!booking) {
      return { data: null };
    }

    // Return full booking summary
    return this.getBookingSummary(booking.id, userId);
  }

  // ==================== Private Helpers ====================

  private async getShowtimeIdsForCinema(cinemaId: string): Promise<string[]> {
    try {
      const result = await firstValueFrom(
        this.cinemaClient.send(CinemaMessage.SHOWTIME.FILTER_SHOWTIME, {
          cinemaId,
        })
      );
      // Result is ServiceResult<ShowtimeSummaryResponse[]>
      const showtimes = result?.data || [];
      // Check if data is array
      if (Array.isArray(showtimes)) {
        return showtimes.map((s) => s.id);
      }
      return [];
    } catch (error) {
      this.logger.error(
        `Failed to get showtime ids for cinema ${cinemaId}`,
        error
      );
      return [];
    }
  }
}
