import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentService } from './payment.service';
import {
  CreatePaymentDto,
  AdminFindAllPaymentsDto,
  FindPaymentsByStatusDto,
  FindPaymentsByDateRangeDto,
  GetPaymentStatisticsDto,
  PaymentMessage,
  PaymentMethod,
} from '@movie-hub/shared-types';
import { RequestContextMetadata } from '@movie-hub/shared-types/common/observability.util';

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
      userId: string;
      _meta?: RequestContextMetadata;
    }
  ) {
    return this.paymentService.createPayment(
      payload.bookingId,
      payload.dto,
      payload.ipAddr,
      payload.userId,
      payload._meta
    );
  }

  @MessagePattern('payment.findOne')
  async findOne(@Payload() payload: { id: string; userId?: string }) {
    return this.paymentService.findOne(payload.id, payload.userId);
  }

  @MessagePattern('payment.findByBooking')
  async findByBooking(
    @Payload() payload: { bookingId: string; userId: string }
  ) {
    return this.paymentService.findByBooking(payload.bookingId, payload.userId);
  }

  @MessagePattern(PaymentMessage.PROVIDER_IPN)
  async handleProviderIPN(
    @Payload()
    payload: {
      provider: PaymentMethod;
      params: Record<string, string>;
      _meta?: RequestContextMetadata;
    }
  ) {
    return this.paymentService.handleProviderIPN(
      payload.provider,
      payload.params,
      payload._meta
    );
  }

  @MessagePattern(PaymentMessage.PROVIDER_RETURN)
  async handleProviderReturn(
    @Payload()
    payload: {
      provider: PaymentMethod;
      params: Record<string, string>;
    }
  ) {
    return this.paymentService.handleProviderReturn(
      payload.provider,
      payload.params
    );
  }

  // ==================== ADMIN OPERATIONS ====================

  @MessagePattern('payment.admin.findAll')
  async adminFindAll(
    @Payload() payload: { filters?: AdminFindAllPaymentsDto }
  ) {
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
  async findByDateRange(
    @Payload() payload: { filters?: FindPaymentsByDateRangeDto }
  ) {
    return this.paymentService.findPaymentsByDateRange(payload?.filters || {});
  }

  @MessagePattern('payment.cancel')
  async cancel(@Payload() payload: { paymentId: string }) {
    return this.paymentService.cancelPayment(payload.paymentId);
  }

  @MessagePattern('payment.getStatistics')
  async getStatistics(
    @Payload() payload: { filters?: GetPaymentStatisticsDto }
  ) {
    return this.paymentService.getPaymentStatistics(payload?.filters || {});
  }
}
