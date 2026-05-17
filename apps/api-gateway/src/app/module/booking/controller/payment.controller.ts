import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { PaymentService } from '../service/payment.service';
import { BookingService } from '../service/booking.service';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';
import { RoleGuard } from '../../../common/guard/role.guard';
import { CurrentUserId } from '../../../common/decorator/current-user-id.decorator';
import { Permission } from '../../../common/decorator/permission.decorator';
import { Roles } from '../../../common/decorator/roles.decorator';
import {
  AppRole,
  CreatePaymentDto,
  AdminFindAllPaymentsDto,
  PaymentStatus,
  PaymentMethod,
} from '@movie-hub/shared-types';
import { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { SensitiveThrottle } from '../../../common/decorator/sensitive-throttle.decorator';

@Controller({
  version: '1',
  path: 'payments',
})
@SensitiveThrottle()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly bookingService: BookingService
  ) {}

  // ==================== PUBLIC ENDPOINTS (NO AUTH) ====================
  // MUST be before :id route to avoid route conflicts

  /**
   * VNPay IPN (Instant Payment Notification) webhook
   * PUBLIC endpoint - VNPay server calls this to notify payment status
   * NO authentication required
   * MUST return JSON: { RspCode: string, Message: string }
   */
  @Get(':provider/ipn')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  async providerIPN(
    @Param('provider') providerParam: string,
    @Query() query: Record<string, string>
  ) {
    const provider = this.parseProviderOrThrow(providerParam);
    const result = await this.paymentService.handleProviderIPN(provider, query);
    // EXCEPTION: Extract data from ServiceResult for VNPay IPN - VNPay expects raw { RspCode, Message }
    return result.data;
  }

  @Post(':provider/ipn')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  async providerIPNPost(
    @Param('provider') providerParam: string,
    @Body() body: Record<string, unknown>
  ) {
    const provider = this.parseProviderOrThrow(providerParam);
    const params = Object.fromEntries(
      Object.entries(body || {}).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
    );
    const result = await this.paymentService.handleProviderIPN(provider, params);
    return result.data;
  }

  /**
   * VNPay return URL - where user is redirected after payment
   * PUBLIC endpoint - user is redirected here from VNPay
   * NO authentication required (user may have lost session)
   */
  @Get(':provider/return')
  @SkipThrottle()
  async providerReturn(
    @Param('provider') providerParam: string,
    @Query() query: Record<string, string>
  ) {
    const provider = this.parseProviderOrThrow(providerParam);
    return this.paymentService.handleProviderReturn(provider, query);
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/all')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CINEMA_MANAGER, AppRole.STAFF)
  @Permission({ resource: 'payment', action: 'read', scope: 'cinema' })
  async adminFindAll(@Query() filters: AdminFindAllPaymentsDto) {
    return this.paymentService.adminFindAll(filters);
  }

  @Get('admin/status/:status')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CINEMA_MANAGER, AppRole.STAFF)
  @Permission({ resource: 'payment', action: 'read', scope: 'cinema' })
  async findByStatus(
    @Param('status') status: PaymentStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number
  ) {
    return this.paymentService.findByStatus(status, page, limit);
  }

  @Put('admin/:id/cancel')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CINEMA_MANAGER)
  @Permission({ resource: 'payment', action: 'update', scope: 'cinema' })
  async cancelPayment(@Param('id') paymentId: string) {
    return this.paymentService.cancelPayment(paymentId);
  }

  @Get('admin/statistics')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CINEMA_MANAGER)
  @Permission({ resource: 'payment', action: 'read', scope: 'cinema' })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('paymentMethod') paymentMethod?: string
  ) {
    return this.paymentService.getStatistics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      paymentMethod,
    });
  }

  // ==================== USER ENDPOINTS ====================

  /**
   * Create payment for a booking
   * Authenticated endpoint - requires valid user session
   */
  @Post('bookings/:bookingId')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CUSTOMER)
  @Permission({ resource: 'payment', action: 'update', scope: 'own' })
  async createPayment(
    @CurrentUserId() userId: string,
    @Param('bookingId') bookingId: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() request: Request
  ) {
    // Ownership check: customer can only initiate payment for their own booking.
    await this.bookingService.findOne(bookingId, userId);

    const ipAddr =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.ip ||
      '127.0.0.1';

    return this.paymentService.createPayment(bookingId, createPaymentDto, ipAddr);
  }

  /**
   * Get all payments for a booking
   * Authenticated endpoint
   */
  @Get('booking/:bookingId')
  @UseGuards(ClerkAuthGuard, RoleGuard)
  @Roles(AppRole.CUSTOMER)
  @Permission({ resource: 'payment', action: 'read', scope: 'own' })
  async getPaymentsByBooking(
    @CurrentUserId() userId: string,
    @Param('bookingId') bookingId: string
  ) {
    // Ownership check: do not disclose payment records of another user's booking.
    await this.bookingService.findOne(bookingId, userId);
    return this.paymentService.getPaymentByBooking(bookingId);
  }

  /**
   * Get payment details
   * Authenticated endpoint
   * MUST be LAST to avoid route conflicts with specific paths
   */
  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  @Permission({ resource: 'payment', action: 'read', scope: 'own' })
  async getPayment(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.paymentService.getPayment(id, userId);
  }

  private parseProviderOrThrow(providerParam: string): PaymentMethod {
    const normalized = providerParam?.trim().toUpperCase();
    const resolved = Object.values(PaymentMethod).find((v) => v === normalized);
    if (resolved) {
      return resolved;
    }
    throw new BadRequestException(
      `Unsupported payment provider: ${providerParam}`
    );
  }
}






