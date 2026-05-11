import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentService } from './payment.service';
import {
  CreatePaymentDto,
  AdminFindAllPaymentsDto,
  FindPaymentsByStatusDto,
  FindPaymentsByDateRangeDto,
  GetPaymentStatisticsDto,
} from '@movie-hub/shared-types';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern('payment.create')
  async create(
    @Payload()
    payload: {
      bookingId: string;
      dto: CreatePaymentDto;
      ipAddr: string;
    }
  ) {
    return this.paymentService.createPayment(
      payload.bookingId,
      payload.dto,
      payload.ipAddr
    );
  }

  @MessagePattern('payment.findOne')
  async findOne(@Payload() payload: { id: string; userId?: string }) {
    return this.paymentService.findOne(payload.id, payload.userId);
  }

  @MessagePattern('payment.findByBooking')
  async findByBooking(@Payload() payload: { bookingId: string }) {
    return this.paymentService.findByBooking(payload.bookingId);
  }

  @MessagePattern('payment.vnpay.ipn')
  async handleVNPayIPN(@Payload() payload: { params: Record<string, string> }) {
    return this.paymentService.handleVNPayIPN(payload.params);
  }

  @MessagePattern('payment.vnpay.return')
  async handleVNPayReturn(@Payload() payload: { params: Record<string, string> }) {
    return this.paymentService.handleVNPayReturn(payload.params);
  }

  // ==================== ADMIN OPERATIONS ====================

  @MessagePattern('payment.admin.findAll')
  async adminFindAll(@Payload() payload: { filters?: AdminFindAllPaymentsDto }) {
    return this.paymentService.adminFindAllPayments(payload?.filters || {});
  }

  @MessagePattern('payment.findByStatus')
  async findByStatus(@Payload() payload: FindPaymentsByStatusDto) {
    return this.paymentService.findPaymentsByStatus(
      payload.status,
      payload.page,
      payload.limit
    );
  }

  @MessagePattern('payment.findByDateRange')
  async findByDateRange(@Payload() payload: { filters?: FindPaymentsByDateRangeDto }) {
    return this.paymentService.findPaymentsByDateRange(payload?.filters || {});
  }

  @MessagePattern('payment.cancel')
  async cancel(@Payload() payload: { paymentId: string }) {
    return this.paymentService.cancelPayment(payload.paymentId);
  }

  @MessagePattern('payment.getStatistics')
  async getStatistics(@Payload() payload: { filters?: GetPaymentStatisticsDto }) {
    return this.paymentService.getPaymentStatistics(payload?.filters || {});
  }
}
