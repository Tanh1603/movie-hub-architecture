import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SeatBookingEvent } from '@movie-hub/shared-types';

export interface ReleaseSeatEvent {
  showtimeId: string;
  seatIds: string[];
}

@Injectable()
export class ResolveBookingService {
  private readonly logger = new Logger(ResolveBookingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createSeatReservations(event: SeatBookingEvent) {
    const { userId, showtimeId, bookingId, seatIds } = event;

    const showtime = await this.prisma.showtimes.findUnique({
      where: { id: showtimeId },
    });
    if (!showtime) throw new BadRequestException('Showtime not found');

    const rows = seatIds.map((seatId) => ({
      showtime_id: showtimeId,
      seat_id: seatId,
      booking_id: bookingId ?? null,
      user_id: userId ?? null,
    }));

    await this.prisma.seatReservations.createMany({
      data: rows,
      skipDuplicates: true,
    });

    return true;
  }

  /**
   * Delete seat reservations when a booking is refunded
   * This releases the seats and updates the available_seats count on the showtime
   */
  async deleteSeatReservations(event: ReleaseSeatEvent): Promise<boolean> {
    const { showtimeId, seatIds } = event;

    if (!seatIds || seatIds.length === 0) {
      this.logger.warn(
        `No seat IDs provided for release in showtime ${showtimeId}`
      );
      return false;
    }

    const showtime = await this.prisma.showtimes.findUnique({
      where: { id: showtimeId },
    });

    if (!showtime) {
      this.logger.error(`Showtime ${showtimeId} not found for seat release`);
      return false;
    }

    // Delete the seat reservations for the given seats
    const deleteResult = await this.prisma.seatReservations.deleteMany({
      where: {
        showtime_id: showtimeId,
        seat_id: { in: seatIds },
      },
    });

    this.logger.log(
      `Deleted ${deleteResult.count} seat reservations for showtime ${showtimeId}`
    );

    // Update the available_seats count on the showtime
    if (deleteResult.count > 0) {
      await this.prisma.showtimes.update({
        where: { id: showtimeId },
        data: {
          available_seats: {
            increment: deleteResult.count,
          },
        },
      });

      this.logger.log(
        `Incremented available_seats by ${deleteResult.count} for showtime ${showtimeId}`
      );
    }

    return true;
  }
}
