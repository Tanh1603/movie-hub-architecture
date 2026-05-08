import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Interval } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import {
  BookingStatus,
  PaymentStatus,
  SERVICE_NAME,
  UserDetailDto,
  UserMessage,
} from '@movie-hub/shared-types';
import {
  sanitizeForLogging,
  serializeStructuredLog,
  RequestContextMetadata,
} from '@movie-hub/shared-types/common/observability.util';
import { OutboxEvents, OutboxStatus } from '../../../generated/prisma';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma.service';
import { TicketService } from '../ticket/ticket.service';
import { resolveBookingRequestContext } from '../common/booking-request-context.util';

const BOOKING_CONFIRMED_NOTIFICATION = 'booking.confirmed.notification';
const MAX_DELIVERY_ATTEMPTS = 3;

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private processing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly ticketService: TicketService,
    @Inject(SERVICE_NAME.USER) private readonly userClient: ClientProxy
  ) {}

  @Interval('outbox-poller', 5000)
  async pollPendingEvents(): Promise<void> {
    try {
      await this.processPendingEvents();
    } catch (error) {
      this.logError('outbox.poll.failed', error);
    }
  }

  async processPendingEvents(limit = 25): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;
    try {
      const events = await this.prisma.outboxEvents.findMany({
        where: {
          status: {
            in: [OutboxStatus.PENDING, OutboxStatus.FAILED],
          },
          delivery_attempts: {
            lt: MAX_DELIVERY_ATTEMPTS,
          },
        },
        orderBy: { created_at: 'asc' },
        take: limit,
      });

      for (const event of events) {
        await this.processOne(event);
      }
    } finally {
      this.processing = false;
    }
  }

  private async processOne(event: OutboxEvents): Promise<void> {
    const claimed = await this.prisma.outboxEvents.updateMany({
      where: {
        id: event.id,
        status: {
          in: [OutboxStatus.PENDING, OutboxStatus.FAILED],
        },
      },
      data: {
        status: OutboxStatus.PROCESSING,
        updated_at: new Date(),
      },
    });

    if (claimed.count !== 1) {
      return;
    }

    try {
      await this.dispatch(event);
      await this.prisma.outboxEvents.update({
        where: { id: event.id },
        data: {
          status: OutboxStatus.DELIVERED,
          processed_at: new Date(),
          updated_at: new Date(),
          last_error: null,
        },
      });
      this.logInfo('outbox.event.delivered', 'Outbox event delivered', {
        eventId: event.id,
        eventType: event.event_type,
        aggregateId: event.aggregate_id,
      }, resolveBookingRequestContext(event.payload as Record<string, unknown>));
    } catch (error) {
      const nextAttempts = event.delivery_attempts + 1;
      await this.prisma.outboxEvents.update({
        where: { id: event.id },
        data: {
          status:
            nextAttempts >= MAX_DELIVERY_ATTEMPTS
              ? OutboxStatus.FAILED
              : OutboxStatus.PENDING,
          delivery_attempts: nextAttempts,
          last_error:
            error instanceof Error ? error.message : String(error),
          updated_at: new Date(),
        },
      });
      this.logError('outbox.event.delivery_failed', error, {
        eventId: event.id,
        eventType: event.event_type,
        aggregateId: event.aggregate_id,
        attempts: nextAttempts,
      }, resolveBookingRequestContext(event.payload as Record<string, unknown>));
    }
  }

  private async dispatch(event: OutboxEvents): Promise<void> {
    switch (event.event_type) {
      case BOOKING_CONFIRMED_NOTIFICATION:
        await this.sendBookingConfirmation(event.aggregate_id, event.payload as Record<string, unknown>);
        return;
      default:
        this.logInfo('outbox.event.ignored', 'No handler registered', {
          eventId: event.id,
          eventType: event.event_type,
        });
    }
  }

  private async sendBookingConfirmation(bookingId: string, payload?: Record<string, unknown>): Promise<void> {
    const requestContext = resolveBookingRequestContext(payload);
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      include: {
        tickets: true,
        booking_concessions: {
          include: { concession: true },
        },
      },
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    let userDetails: UserDetailDto | null = null;
    try {
      userDetails = await firstValueFrom(
        this.userClient.send<UserDetailDto>(
          UserMessage.GET_USER_DETAIL,
          booking.user_id
        )
      );
    } catch (error) {
      this.logInfo('outbox.notification.user_lookup_skipped', 'Using booking customer data', {
        bookingId,
        error: sanitizeForLogging(error),
      }, requestContext);
    }

    const ticketsWithQR = await Promise.all(
      booking.tickets.map(async (ticket) => {
        try {
          const qr = await this.ticketService.generateQRCode(ticket.id);
          return {
            ticketCode: ticket.ticket_code,
            seatNumber: ticket.seat_id,
            ticketType: ticket.ticket_type,
            price: Number(ticket.price),
            qrCode: qr.data,
          };
        } catch (error) {
          this.logInfo('outbox.notification.qr_skipped', 'Ticket QR generation failed', {
            bookingId,
            ticketId: ticket.id,
            error: sanitizeForLogging(error),
          }, requestContext);
          return {
            ticketCode: ticket.ticket_code,
            seatNumber: ticket.seat_id,
            ticketType: ticket.ticket_type,
            price: Number(ticket.price),
            qrCode: '',
          };
        }
      })
    );

    const sent = await this.notificationService.sendBookingConfirmation({
      booking: {
        id: booking.id,
        bookingCode: booking.booking_code,
        showtimeId: booking.showtime_id,
        userId: booking.user_id,
        customerName: userDetails?.fullName || booking.customer_name,
        customerEmail: userDetails?.email || booking.customer_email,
        customerPhone: userDetails?.phone || booking.customer_phone,
        movieTitle: 'Movie Title',
        cinemaName: 'Cinema Name',
        hallName: 'Hall Name',
        startTime: new Date(),
        seatCount: booking.tickets.length,
        seats: booking.tickets.map((ticket) => ({
          seatId: ticket.seat_id,
          row: 'A',
          number: 1,
          seatType: ticket.ticket_type,
          ticketType: ticket.ticket_type,
          price: Number(ticket.price),
        })),
        concessions: booking.booking_concessions.map((item) => ({
          concessionId: item.concession_id,
          name: item.concession?.name || 'Item',
          quantity: item.quantity,
          unitPrice: Number(item.unit_price),
          totalPrice: Number(item.total_price),
        })),
        subtotal: Number(booking.subtotal),
        discount: Number(booking.discount),
        pointsUsed: booking.points_used,
        pointsDiscount: Number(booking.points_discount),
        finalAmount: Number(booking.final_amount),
        totalAmount: Number(booking.final_amount),
        promotionCode: booking.promotion_code,
        status: booking.status as BookingStatus,
        paymentStatus: booking.payment_status as PaymentStatus,
        expiresAt: booking.expires_at,
        cancelledAt: booking.cancelled_at,
        cancellationReason: booking.cancellation_reason,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
      },
      tickets: ticketsWithQR,
    });

    if (!sent) {
      throw new Error(`Booking confirmation notification was not sent for ${bookingId}`);
    }
  }

  private logInfo(
    action: string,
    message: string,
    metadata?: Record<string, unknown>,
    context?: Partial<RequestContextMetadata>
  ) {
    this.logger.log(
      serializeStructuredLog({
        level: 'info',
        service: OutboxService.name,
        correlationId: context?.correlationId,
        requestId: context?.requestId,
        userId: context?.userId,
        action,
        message,
        metadata,
      })
    );
  }

  private logError(
    action: string,
    error: unknown,
    metadata?: Record<string, unknown>,
    context?: Partial<RequestContextMetadata>
  ) {
    const errorObject = error instanceof Error ? error : new Error(String(error));
    this.logger.error(
      serializeStructuredLog({
        level: 'error',
        service: OutboxService.name,
        correlationId: context?.correlationId,
        requestId: context?.requestId,
        userId: context?.userId,
        action,
        message: errorObject.message,
        errorCode: errorObject.name,
        metadata: {
          ...metadata,
          error: sanitizeForLogging(error),
        },
      }),
      errorObject.stack
    );
  }
}

export { BOOKING_CONFIRMED_NOTIFICATION };
