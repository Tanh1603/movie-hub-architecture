import {
  Injectable,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma.service';
import { PromotionService } from '../promotion/promotion.service';
import { NotificationService } from '../notification/notification.service';
import {
  CreateRefundDto,
  RefundDetailDto,
  RefundStatus,
  BookingStatus,
  ServiceResult,
  CinemaMessage,
  SERVICE_NAME,
  PromotionDto,
  ShowtimeSeatResponse,
  UserMessage,
  UserDetailDto,
} from '@movie-hub/shared-types';
import {
  Prisma,
  RefundStatus as PrismaRefundStatus,
  PromotionType,
} from '../../../generated/prisma';

// Response type for processRefundAsVoucher
export interface RefundVoucherResult {
  bookingId: string;
  bookingCode: string;
  refundAmount: number;
  voucher: PromotionDto;
  message: string;
}

@Injectable()
export class RefundService {
  private readonly REFUND_HOURS_BEFORE = 24; // Must request refund 24 hours before showtime
  private readonly logger = new Logger(RefundService.name);

  constructor(
    private prisma: PrismaService,
    private promotionService: PromotionService,
    @Inject(SERVICE_NAME.CINEMA) private cinemaClient: ClientProxy,
    @Inject(SERVICE_NAME.USER) private userClient: ClientProxy,
    private notificationService: NotificationService
  ) {}

  /**
   * Create a refund request
   */
  async createRefund(
    dto: CreateRefundDto
  ): Promise<ServiceResult<RefundDetailDto>> {
    // Verify payment exists
    const payment = await this.prisma.payments.findUnique({
      where: { id: dto.paymentId },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Can only refund completed payments');
    }

    // Check if refund amount is valid
    const existingRefunds = await this.prisma.refunds.findMany({
      where: {
        payment_id: dto.paymentId,
        status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] },
      },
    });

    const totalRefunded = existingRefunds.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );

    if (totalRefunded + dto.amount > Number(payment.amount)) {
      throw new BadRequestException(
        `Cannot refund more than payment amount. Available: ${
          Number(payment.amount) - totalRefunded
        }`
      );
    }

    const refund = await this.prisma.refunds.create({
      data: {
        payment_id: dto.paymentId,
        amount: dto.amount,
        reason: dto.reason,
        status: RefundStatus.PENDING,
      },
      include: {
        payment: {
          include: {
            booking: true,
          },
        },
      },
    });

    return {
      data: this.mapToDetailDto(refund),
      message: 'Refund request created successfully',
    };
  }

  /**
   * Find all refunds with filters
   */
  async findAllRefunds(
    filters: {
      paymentId?: string;
      status?: RefundStatus;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ServiceResult<RefundDetailDto[]>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.RefundsWhereInput = {};

    if (filters?.paymentId) where.payment_id = filters.paymentId;
    if (filters?.status) where.status = filters.status as PrismaRefundStatus;

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = filters.startDate;
      if (filters.endDate) where.created_at.lte = filters.endDate;
    }

    const [refunds, total] = await Promise.all([
      this.prisma.refunds.findMany({
        where,
        include: {
          payment: {
            include: {
              booking: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.refunds.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: refunds.map((r) => this.mapToDetailDto(r)),
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
   * Find one refund by ID
   */
  async findOne(id: string): Promise<ServiceResult<RefundDetailDto>> {
    const refund = await this.prisma.refunds.findUnique({
      where: { id },
      include: {
        payment: {
          include: {
            booking: true,
          },
        },
      },
    });

    if (!refund) {
      throw new BadRequestException('Refund not found');
    }

    return {
      data: this.mapToDetailDto(refund),
    };
  }

  /**
   * Find refunds by payment ID
   */
  async findByPayment(
    paymentId: string
  ): Promise<ServiceResult<RefundDetailDto[]>> {
    const refunds = await this.prisma.refunds.findMany({
      where: { payment_id: paymentId },
      include: {
        payment: {
          include: {
            booking: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      data: refunds.map((r) => this.mapToDetailDto(r)),
    };
  }

  /**
   * Process a refund (mark as processing)
   */
  async processRefund(
    refundId: string
  ): Promise<ServiceResult<RefundDetailDto>> {
    const refund = await this.prisma.refunds.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new BadRequestException('Refund not found');
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new BadRequestException('Can only process pending refunds');
    }

    const updated = await this.prisma.refunds.update({
      where: { id: refundId },
      data: { status: RefundStatus.PROCESSING },
      include: {
        payment: {
          include: {
            booking: true,
          },
        },
      },
    });

    return {
      data: this.mapToDetailDto(updated),
      message: 'Refund marked as processing',
    };
  }

  /**
   * Approve and complete a refund
   */
  async approveRefund(
    refundId: string
  ): Promise<ServiceResult<RefundDetailDto>> {
    const refund = await this.prisma.refunds.findUnique({
      where: { id: refundId },
      include: {
        payment: true,
      },
    });

    if (!refund) {
      throw new BadRequestException('Refund not found');
    }

    if (!['PENDING', 'PROCESSING'].includes(refund.status)) {
      throw new BadRequestException(
        'Can only approve pending or processing refunds'
      );
    }

    // Update refund status and payment status
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update refund
      const updatedRefund = await tx.refunds.update({
        where: { id: refundId },
        data: {
          status: RefundStatus.COMPLETED,
          refunded_at: new Date(),
        },
        include: {
          payment: {
            include: {
              booking: {
                include: {
                  tickets: true, // Include tickets to get seat IDs for release
                },
              },
            },
          },
        },
      });

      // Update payment status to REFUNDED
      await tx.payments.update({
        where: { id: refund.payment_id },
        data: { status: 'REFUNDED' },
      });

      // Update booking status to CANCELLED if not already
      if (refund.payment?.booking_id) {
        await tx.bookings.update({
          where: { id: refund.payment.booking_id },
          data: {
            status: 'CANCELLED',
            cancelled_at: new Date(),
            cancellation_reason: 'Refund processed',
          },
        });
      }

      return updatedRefund;
    });

    // Release seats via Cinema service (fire-and-forget)
    if (updated.payment?.booking) {
      const booking = updated.payment.booking;
      const tickets = booking.tickets || [];

      if (tickets.length > 0 && booking.showtime_id) {
        try {
          const seatIds = tickets.map((t) => t.seat_id);
          this.cinemaClient.emit(CinemaMessage.SHOWTIME.RELEASE_SEATS, {
            showtimeId: booking.showtime_id,
            seatIds,
          });
          this.logger.log(
            `Emitted seat release event for booking ${booking.id}: ${seatIds.length} seats`
          );
        } catch (error) {
          this.logger.warn(
            `Failed to emit seat release event for booking ${booking.id}`,
            error
          );
          // Don't fail the refund if seat release fails - can be handled manually
        }
      }
    }

    // Send email notification
    if (updated.payment?.booking?.showtime_id) {
      try {
        const booking = updated.payment.booking;
        const showtimeData: ShowtimeSeatResponse = await firstValueFrom(
          this.cinemaClient.send(CinemaMessage.SHOWTIME.GET_SHOWTIME_SEATS, {
            showtimeId: booking.showtime_id,
          })
        );

        if (showtimeData) {
          // Fetch user details to get authoritative email
          let userEmail = booking.customer_email;
          let userName = booking.customer_name;

          try {
            const userDetails = await firstValueFrom(
              this.userClient.send<UserDetailDto>(
                UserMessage.GET_USER_DETAIL,
                booking.user_id
              )
            );
            if (userDetails?.email) userEmail = userDetails.email;
            if (userDetails?.fullName) userName = userDetails.fullName;
          } catch (err) {
            this.logger.warn(
              `Failed to fetch user details for refund notification: ${booking.user_id}`
            );
          }

          const emailBookingDto: any = {
            bookingCode: booking.booking_code,
            movieTitle: showtimeData.showtime.movieTitle,
            cinemaName: showtimeData.cinemaName,
            hallName: showtimeData.hallName,
            startTime: new Date(showtimeData.showtime.start_time),
            endTime: new Date(showtimeData.showtime.end_time),
            customerEmail: userEmail,
            customerName: userName,
            cancelledAt: new Date(),
            cancellationReason: 'Refund processed',
          };

          await this.notificationService.sendBookingCancellation(
            emailBookingDto,
            Number(updated.amount)
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to send refund email for refund ${refundId}`,
          error
        );
      }
    }

    return {
      data: this.mapToDetailDto(updated),
      message: 'Refund approved and completed successfully',
    };
  }

  /**
   * Reject a refund request
   */
  async rejectRefund(
    refundId: string,
    reason: string
  ): Promise<ServiceResult<RefundDetailDto>> {
    const refund = await this.prisma.refunds.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new BadRequestException('Refund not found');
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new BadRequestException('Can only reject pending refunds');
    }

    const updated = await this.prisma.refunds.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.FAILED,
        reason: `${refund.reason}\nRejection reason: ${reason}`,
      },
      include: {
        payment: {
          include: {
            booking: true,
          },
        },
      },
    });

    return {
      data: this.mapToDetailDto(updated),
      message: 'Refund rejected',
    };
  }

  /**
   * Process refund as voucher (24-hour policy)
   *
   * Flow:
   * 1. Validate booking exists and is CONFIRMED
   * 2. Get showtime details from Cinema service
   * 3. Check if >24 hours before showtime
   * 4. Generate promotion code with ticket value
   * 5. Update booking status to REFUNDED
   * 6. Return voucher details
   */
  async processRefundAsVoucher(
    bookingId: string,
    userId: string,
    reason?: string
  ): Promise<ServiceResult<RefundVoucherResult>> {
    this.logger.log(`Processing refund as voucher for booking ${bookingId}`);

    // 1. Get booking with tickets
    const booking = await this.prisma.bookings.findFirst({
      where: { id: bookingId, user_id: userId },
      include: { tickets: true, payments: true },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Can only refund confirmed bookings. Current status: ${booking.status}`
      );
    }

    // 2. Get showtime details from Cinema service
    let showtimeData: ShowtimeSeatResponse;
    try {
      showtimeData = await firstValueFrom(
        this.cinemaClient.send(CinemaMessage.SHOWTIME.GET_SHOWTIME_SEATS, {
          showtimeId: booking.showtime_id,
        })
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch showtime ${booking.showtime_id}`,
        error
      );
      throw new BadRequestException('Cannot fetch showtime information');
    }

    if (!showtimeData?.showtime?.start_time) {
      throw new BadRequestException('Showtime information not available');
    }

    const showtimeStart = new Date(showtimeData.showtime.start_time);
    const now = new Date();
    const hoursUntilShowtime =
      (showtimeStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    // 3. Check 24-hour policy
    if (hoursUntilShowtime <= this.REFUND_HOURS_BEFORE) {
      throw new BadRequestException(
        `Refund must be requested at least ${this.REFUND_HOURS_BEFORE} hours before showtime. ` +
          `Current time until showtime: ${hoursUntilShowtime.toFixed(1)} hours`
      );
    }

    // 4. Calculate refund amount (100% of ticket value)
    const ticketAmount = booking.tickets.reduce(
      (sum, t) => sum + Number(t.price),
      0
    );

    if (ticketAmount <= 0) {
      throw new BadRequestException('No ticket amount to refund');
    }

    // 5. Transaction: Generate voucher and Update Booking atomically
    // This prevents race conditions where a user could request multiple refunds for the same booking
    const result = await this.prisma.$transaction(async (tx) => {
      // Re-check booking status inside transaction to ensure lock/consistency
      const freshBooking = await tx.bookings.findUnique({
        where: { id: bookingId },
      });

      if (!freshBooking || freshBooking.status !== BookingStatus.CONFIRMED) {
        throw new BadRequestException(
          `Booking status changed. Cannot process refund. Current status: ${freshBooking?.status}`
        );
      }

      // Generate voucher code
      const code = `REFUND-${booking.booking_code}-${Date.now()
        .toString(36)
        .toUpperCase()}`;

      const validTo = new Date();
      validTo.setFullYear(validTo.getFullYear() + 1); // Valid for 1 year

      // Create promotion using the transaction client
      const promotion = await tx.promotions.create({
        data: {
          code,
          name: `Refund Voucher - ${booking.booking_code}`,
          description: `Refund voucher for booking ${
            booking.booking_code
          }. Original value: ${ticketAmount.toLocaleString()} VND`,
          type: PromotionType.FIXED_AMOUNT,
          value: ticketAmount,
          min_purchase: 0,
          max_discount: ticketAmount,
          valid_from: new Date(),
          valid_to: validTo,
          usage_limit: 1,
          usage_per_user: 1,
          current_usage: 0,
          applicable_for: ['REFUND'],
          conditions: {
            originalBookingId: bookingId,
            userId: userId,
            isRefundVoucher: true,
          },
          active: true,
        },
      });

      // Update booking status
      await tx.bookings.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.REFUNDED,
          cancellation_reason: reason || 'Refunded as voucher',
          cancelled_at: new Date(),
        },
      });

      return {
        voucher: this.promotionService.mapToDto(promotion), // Use public helper if available or map manually
      };
    });

    // 6. Release seats via Cinema service (fire-and-forget)
    try {
      const seatIds = booking.tickets.map((t) => t.seat_id);
      this.cinemaClient.emit(CinemaMessage.SHOWTIME.RELEASE_SEATS, {
        showtimeId: booking.showtime_id,
        seatIds,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to release seats for booking ${bookingId}`,
        error
      );
      // Don't fail the refund if seat release fails - can be handled manually
    }

    this.logger.log(
      `Refund as voucher completed for booking ${bookingId}. Voucher: ${result.voucher.code}`
    );

    // Send email notification async
    this.sendVoucherRefundNotification(bookingId, ticketAmount, showtimeData);

    return {
      data: {
        bookingId,
        bookingCode: booking.booking_code,
        refundAmount: ticketAmount,
        voucher: result.voucher,
        message: `Refund processed successfully. Your voucher code is: ${result.voucher.code}`,
      },
      message: `Voucher code: ${result.voucher.code}`,
    };
  }

  // Helper method to send email notification async
  private async sendVoucherRefundNotification(
    bookingId: string,
    ticketAmount: number,
    showtimeData: ShowtimeSeatResponse
  ) {
    try {
      const updatedBooking = await this.prisma.bookings.findUnique({
        where: { id: bookingId },
        include: {
          tickets: true,
          booking_concessions: { include: { concession: true } },
        },
      });

      if (updatedBooking) {
        // Fetch user details to get authoritative email
        let userEmail = updatedBooking.customer_email;
        let userName = updatedBooking.customer_name;

        try {
          const userDetails = await firstValueFrom(
            this.userClient.send<UserDetailDto>(
              UserMessage.GET_USER_DETAIL,
              updatedBooking.user_id
            )
          );
          if (userDetails?.email) userEmail = userDetails.email;
          if (userDetails?.fullName) userName = userDetails.fullName;
        } catch (err) {
          this.logger.warn(
            `Failed to fetch user details for voucher refund notification: ${updatedBooking.user_id}`
          );
        }

        const emailBookingDto: any = {
          bookingCode: updatedBooking.booking_code,
          movieTitle: showtimeData.showtime.movieTitle,
          cinemaName: showtimeData.cinemaName,
          hallName: showtimeData.hallName,
          startTime: new Date(showtimeData.showtime.start_time),
          endTime: new Date(showtimeData.showtime.end_time),
          customerEmail: userEmail,
          customerName: userName,
          cancelledAt: updatedBooking.cancelled_at,
          cancellationReason: updatedBooking.cancellation_reason,
        };

        await this.notificationService.sendBookingCancellation(
          emailBookingDto,
          ticketAmount
        );
      }
    } catch (emailError) {
      this.logger.error(
        `Failed to send refund voucher email for booking ${bookingId}`,
        emailError
      );
    }
  }

  private mapToDetailDto(
    refund: Prisma.RefundsGetPayload<{
      include: {
        payment: {
          include: {
            booking: true;
          };
        };
      };
    }>
  ): RefundDetailDto {
    return {
      id: refund.id,
      paymentId: refund.payment_id,
      bookingId: refund.payment?.booking_id || '',
      bookingCode: refund.payment?.booking?.booking_code || '',
      amount: Number(refund.amount),
      reason: refund.reason,
      status: refund.status as RefundStatus,
      refundedAt: refund.refunded_at,
      createdAt: refund.created_at,
      payment: refund.payment
        ? {
            id: refund.payment.id,
            amount: Number(refund.payment.amount),
            paymentMethod: refund.payment.payment_method,
            transactionId: refund.payment.transaction_id,
          }
        : undefined,
    };
  }
}
