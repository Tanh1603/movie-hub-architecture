import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TicketService } from '../service/ticket.service';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';
import { RoleGuard } from '../../../common/guard/role.guard';
import { CurrentUserId } from '../../../common/decorator/current-user-id.decorator';
import { Permission } from '../../../common/decorator/permission.decorator';
import { Roles } from '../../../common/decorator/roles.decorator';
import { AppRole } from '@movie-hub/shared-types';
import { AdminFindAllTicketsDto, BulkValidateTicketsDto } from '@movie-hub/shared-types';

@Controller({
  version: '1',
  path: 'tickets',
})
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  /**
   * Get ticket details by ID
   * Authenticated endpoint
   */
  @Get(':id')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CUSTOMER)
  @Permission({ resource: 'ticket', action: 'read', scope: 'own' })
  async getTicket(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.ticketService.findOne(id);
  }

  /**
   * Find ticket by ticket code
   * Authenticated endpoint
   */
  @Get('code/:ticketCode')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CUSTOMER)
  @Permission({ resource: 'ticket', action: 'read', scope: 'own' })
  async getTicketByCode(
    @CurrentUserId() userId: string,
    @Param('ticketCode') ticketCode: string
  ) {
    return this.ticketService.findByCode(ticketCode);
  }

  /**
   * Validate a ticket (for cinema staff)
   * This endpoint checks if a ticket is valid for entry
   */
  @Post(':id/validate')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.STAFF)
  @Permission({ resource: 'ticket', action: 'validate', scope: 'cinema' })
  @HttpCode(HttpStatus.OK)
  async validateTicket(
    @CurrentUserId() userId: string,
    @Param('id') ticketId: string,
    @Body('validationCode') validationCode?: string,
    @Body('cinemaId') cinemaId?: string
  ) {
    return this.ticketService.validateTicket(
      ticketId,
      validationCode,
      cinemaId
    );
  }

  /**
   * Mark a ticket as used (for cinema staff)
   * This is called after successful entry scan
   */
  @Post(':id/use')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.STAFF)
  @Permission({ resource: 'ticket', action: 'update', scope: 'cinema' })
  @HttpCode(HttpStatus.OK)
  async useTicket(@CurrentUserId() userId: string, @Param('id') ticketId: string) {
    return this.ticketService.useTicket(ticketId);
  }

  /**
   * Generate QR code for a ticket
   * Returns base64 encoded QR code image
   */
  @Get(':id/qr')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CUSTOMER)
  @Permission({ resource: 'ticket', action: 'read', scope: 'own' })
  async generateQRCode(
    @CurrentUserId() userId: string,
    @Param('id') ticketId: string
  ) {
    const qrCode = await this.ticketService.generateQRCode(ticketId);
    return { qrCode };
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/all')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.STAFF)
  @Permission({ resource: 'ticket', action: 'read', scope: 'cinema' })
  async adminFindAll(@Query() filters: AdminFindAllTicketsDto) {
    return this.ticketService.adminFindAll(filters);
  }

  @Get('admin/showtime/:showtimeId')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.STAFF)
  @Permission({ resource: 'ticket', action: 'read', scope: 'cinema' })
  async findByShowtime(@Param('showtimeId') showtimeId: string) {
    return this.ticketService.findByShowtime(showtimeId);
  }

  @Get('admin/booking/:bookingId')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.STAFF)
  @Permission({ resource: 'ticket', action: 'read', scope: 'cinema' })
  async findByBooking(@Param('bookingId') bookingId: string) {
    return this.ticketService.findByBooking(bookingId);
  }

  @Post('admin/bulk-validate')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.STAFF)
  @Permission({ resource: 'ticket', action: 'validate', scope: 'cinema' })
  @HttpCode(HttpStatus.OK)
  async bulkValidate(@Body() bulkValidateDto: BulkValidateTicketsDto) {
    return this.ticketService.bulkValidate(bulkValidateDto);
  }

  @Put('admin/:id/cancel')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CINEMA_MANAGER)
  @Permission({ resource: 'ticket', action: 'update', scope: 'cinema' })
  async cancelTicket(
    @Param('id') ticketId: string,
    @Body('reason') reason?: string
  ) {
    return this.ticketService.cancelTicket(ticketId, reason);
  }
}

