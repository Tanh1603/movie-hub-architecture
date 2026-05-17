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
} from '@nestjs/common';
import { PaymentService } from '../service/payment.service';
import { ClerkAuthGuard } from '../../../common/guard/clerk-auth.guard';
import { CurrentUserId } from '../../../common/decorator/current-user-id.decorator';
import { CreatePaymentDto, AdminFindAllPaymentsDto, PaymentStatus } from '@movie-hub/shared-types';
import { Request } from 'express';

@Controller({
  version: '1',
  path: 'payments',
})
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ==================== PUBLIC ENDPOINTS (NO AUTH) ====================
  // MUST be before :id route to avoid route conflicts

  /**
   * VNPay IPN (Instant Payment Notification) webhook
   * PUBLIC endpoint - VNPay server calls this to notify payment status
   * NO authentication required
   * MUST return JSON: { RspCode: string, Message: string }
   */
  @Get('vnpay/ipn')
  @HttpCode(HttpStatus.OK)
  async vnpayIPN(@Query() query: Record<string, string>, @Req() request: Request) {
    const result = (await this.paymentService.handleVNPayIPN(query, request)) as {
      data: unknown;
    };
    // EXCEPTION: Extract data from ServiceResult for VNPay IPN - VNPay expects raw { RspCode, Message }
    return result.data;
  }

  /**
   * VNPay return URL - where user is redirected after payment
   * PUBLIC endpoint - user is redirected here from VNPay
   * NO authentication required (user may have lost session)
   */
  @Get('vnpay/return')
  async vnpayReturn(@Query() query: Record<string, string>, @Req() request: Request) {
    return this.paymentService.handleVNPayReturn(query, request);
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/all')
  @UseGuards(ClerkAuthGuard)
  async adminFindAll(@Query() filters: AdminFindAllPaymentsDto, @Req() request: Request) {
    return this.paymentService.adminFindAll(filters, request);
  }

  @Get('admin/status/:status')
  @UseGuards(ClerkAuthGuard)
  async findByStatus(
    @Param('status') status: PaymentStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Req() request?: Request
  ) {
    return this.paymentService.findByStatus(status, page, limit, request);
  }

  @Put('admin/:id/cancel')
  @UseGuards(ClerkAuthGuard)
  async cancelPayment(@Param('id') paymentId: string, @Req() request: Request) {
    return this.paymentService.cancelPayment(paymentId, request);
  }

  @Get('admin/statistics')
  @UseGuards(ClerkAuthGuard)
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Req() request?: Request
  ) {
    return this.paymentService.getStatistics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      paymentMethod,
    }, request);
  }

  // ==================== USER ENDPOINTS ====================

  /**
   * Create payment for a booking
   * Authenticated endpoint - requires valid user session
   */
  @Post('bookings/:bookingId')
  @UseGuards(ClerkAuthGuard)
  async createPayment(
    @CurrentUserId() userId: string,
    @Param('bookingId') bookingId: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() request: Request
  ) {
    const ipAddr =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.ip ||
      '127.0.0.1';

    return this.paymentService.createPayment(
      bookingId,
      createPaymentDto,
      ipAddr,
      userId,
      request
    );
  }

  /**
   * Get all payments for a booking
   * Authenticated endpoint
   */
  @Get('booking/:bookingId')
  @UseGuards(ClerkAuthGuard)
  async getPaymentsByBooking(
    @CurrentUserId() userId: string,
    @Param('bookingId') bookingId: string,
    @Req() request: Request
  ) {
    return this.paymentService.getPaymentByBooking(bookingId, userId, request);
  }

  /**
   * Get payment details
   * Authenticated endpoint
   * MUST be LAST to avoid route conflicts with specific paths
   */
  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  async getPayment(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Req() request: Request
  ) {
    return this.paymentService.getPayment(id, userId, request);
  }
}
