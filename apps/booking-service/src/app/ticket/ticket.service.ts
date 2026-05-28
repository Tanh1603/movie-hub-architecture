import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  TicketDetailDto,
  TicketStatus,
  ResponseMessage,
  ServiceResult,
} from '@movie-hub/shared-types';
import * as QRCode from 'qrcode';

@Injectable()
export class TicketService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string): Promise<ServiceResult<TicketDetailDto>> {
    const ticket = await this.prisma.tickets.findUnique({
      where: { id },
      include: {
        booking: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return {
      data: this.mapToDto(ticket),
    };
  }

  async findByCode(ticketCode: string): Promise<ServiceResult<TicketDetailDto>> {
    const ticket = await this.prisma.tickets.findUnique({
      where: { ticket_code: ticketCode },
      include: {
        booking: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return {
      data: this.mapToDto(ticket),
    };
  }

  async validateTicket(
    ticketId: string,
    validationCode?: string,
    cinemaId?: string
  ): Promise<ServiceResult<{ valid: boolean; message: string; ticket?: TicketDetailDto }>> {
    const ticket = await this.prisma.tickets.findUnique({
      where: { id: ticketId },
      include: {
        booking: true,
      },
    });

    if (!ticket) {
      return {
        data: {
          valid: false,
          message: 'Ticket not found',
        },
      };
    }

    if (ticket.status !== TicketStatus.VALID) {
      return {
        data: {
          valid: false,
          message: `Ticket is ${ticket.status.toLowerCase()}`,
        },
      };
    }

    // Additional validations can be added here
    // e.g., check cinema_id, showtime, etc.

    return {
      data: {
        valid: true,
        message: 'Ticket is valid',
        ticket: this.mapToDto(ticket),
      },
    };
  }

  async useTicket(ticketId: string): Promise<ServiceResult<TicketDetailDto>> {
    const ticket = await this.prisma.tickets.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.USED,
        used_at: new Date(),
      },
      include: {
        booking: true,
      },
    });

    return {
      data: this.mapToDto(ticket),
      message: ResponseMessage.MSG_7,
    };
  }

  /**
   * Generate QR code as Base64 data URL for a ticket
   * QR code contains: ticket code, booking ID, seat info for validation
   */
  async generateQRCode(ticketId: string): Promise<ServiceResult<string>> {
    const ticket = await this.prisma.tickets.findUnique({
      where: { id: ticketId },
      include: {
        booking: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // QR code payload with validation data
    const qrPayload = JSON.stringify({
      ticketCode: ticket.ticket_code,
      ticketId: ticket.id,
      bookingId: ticket.booking_id,
      seatId: ticket.seat_id,
      showtimeId: ticket.booking.showtime_id,
      issuedAt: new Date().toISOString(),
    });

    // Generate QR code as Base64 data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H', // High error correction
      type: 'image/png',
      width: 300,
      margin: 1,
    });

    // Update ticket with QR code
    await this.prisma.tickets.update({
      where: { id: ticketId },
      data: { qr_code: qrCodeDataURL },
    });

    return {
      data: qrCodeDataURL,
      message: ResponseMessage.MSG_7,
    };
  }

  private mapToDto(ticket: any): TicketDetailDto {
    return {
      id: ticket.id,
      bookingId: ticket.booking_id,
      seatId: ticket.seat_id,
      ticketCode: ticket.ticket_code,
      qrCode: ticket.qr_code,
      barcodeData: ticket.barcode,
      movieTitle: 'Movie Title', // Should fetch from showtime
      cinemaName: 'Cinema Name',
      hallName: 'Hall Name',
      seatInfo: 'A-5', // Should fetch from seat
      startTime: new Date(),
      format: '2D',
      language: 'Vietnamese',
      status: ticket.status as TicketStatus,
      usedAt: ticket.used_at,
      createdAt: ticket.created_at,
    };
  }

  // ==================== ADMIN OPERATIONS ====================

  /**
   * Admin: Find all tickets with filters
   */
  async adminFindAllTickets(filters: {
    bookingId?: string;
    showtimeId?: string;
    status?: TicketStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<ServiceResult<TicketDetailDto[]>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.bookingId) where.booking_id = filters.bookingId;
    if (filters?.status) where.status = filters.status;

    // For showtime filtering, we need to join through booking
    if (filters?.showtimeId) {
      where.booking = {
        showtime_id: filters.showtimeId,
      };
    }

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {};
      if (filters.startDate) where.created_at.gte = filters.startDate;
      if (filters.endDate) where.created_at.lte = filters.endDate;
    }

    const [tickets, total] = await Promise.all([
      this.prisma.tickets.findMany({
        where,
        include: {
          booking: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tickets.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: tickets.map((t) => this.mapToDto(t)),
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
   * Find all tickets for a specific showtime
   */
  async findTicketsByShowtime(
    showtimeId: string,
    status?: TicketStatus
  ): Promise<ServiceResult<TicketDetailDto[]>> {
    const where: any = {
      booking: {
        showtime_id: showtimeId,
      },
    };

    if (status) where.status = status;

    const tickets = await this.prisma.tickets.findMany({
      where,
      include: {
        booking: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      data: tickets.map((t) => this.mapToDto(t)),
    };
  }

  /**
   * Find all tickets for a specific booking
   */
  async findTicketsByBooking(bookingId: string): Promise<ServiceResult<TicketDetailDto[]>> {
    const tickets = await this.prisma.tickets.findMany({
      where: { booking_id: bookingId },
      include: {
        booking: true,
      },
      orderBy: { created_at: 'asc' },
    });

    return {
      data: tickets.map((t) => this.mapToDto(t)),
    };
  }

  /**
   * Bulk validate multiple tickets
   */
  async bulkValidateTickets(
    ticketIds: string[],
    cinemaId?: string
  ): Promise<ServiceResult<{
    valid: string[];
    invalid: { ticketId: string; reason: string }[];
  }>> {
    const tickets = await this.prisma.tickets.findMany({
      where: {
        id: { in: ticketIds },
      },
      include: {
        booking: true,
      },
    });

    const valid: string[] = [];
    const invalid: { ticketId: string; reason: string }[] = [];

    for (const ticketId of ticketIds) {
      const ticket = tickets.find((t) => t.id === ticketId);

      if (!ticket) {
        invalid.push({ ticketId, reason: 'Ticket not found' });
        continue;
      }

      if (ticket.status !== TicketStatus.VALID) {
        invalid.push({
          ticketId,
          reason: `Ticket is ${ticket.status.toLowerCase()}`,
        });
        continue;
      }

      // Additional validations (cinema, showtime, etc.) can be added here

      valid.push(ticketId);
    }

    return {
      data: { valid, invalid },
    };
  }

  /**
   * Cancel a ticket
   */
  async cancelTicket(
    ticketId: string,
    reason?: string
  ): Promise<ServiceResult<TicketDetailDto>> {
    const ticket = await this.prisma.tickets.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.status === TicketStatus.USED) {
      throw new Error('Cannot cancel a used ticket');
    }

    const updated = await this.prisma.tickets.update({
      where: { id: ticketId },
      data: { status: TicketStatus.CANCELLED },
      include: {
        booking: true,
      },
    });

    return {
      data: this.mapToDto(updated),
      message: ResponseMessage.MSG_7,
    };
  }
}
