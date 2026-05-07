import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RefundService } from './refund.service';
import {
  CreateRefundDto,
  FindAllRefundsDto,
  RefundMessage,
} from '@movie-hub/shared-types';

@Controller()
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @MessagePattern('refund.create')
  async create(@Payload() payload: { dto: CreateRefundDto }) {
    return this.refundService.createRefund(payload.dto);
  }

  @MessagePattern('refund.findAll')
  async findAll(@Payload() payload: { filters?: FindAllRefundsDto }) {
    return this.refundService.findAllRefunds(payload?.filters || {});
  }

  @MessagePattern('refund.findOne')
  async findOne(@Payload() payload: { id: string }) {
    return this.refundService.findOne(payload.id);
  }

  @MessagePattern('refund.findByPayment')
  async findByPayment(@Payload() payload: { paymentId: string }) {
    return this.refundService.findByPayment(payload.paymentId);
  }

  @MessagePattern('refund.process')
  async process(@Payload() payload: { refundId: string }) {
    return this.refundService.processRefund(payload.refundId);
  }

  @MessagePattern('refund.approve')
  async approve(@Payload() payload: { refundId: string }) {
    return this.refundService.approveRefund(payload.refundId);
  }

  @MessagePattern('refund.reject')
  async reject(@Payload() payload: { refundId: string; reason: string }) {
    return this.refundService.rejectRefund(payload.refundId, payload.reason);
  }

  @MessagePattern(RefundMessage.PROCESS_VOUCHER)
  async processAsVoucher(
    @Payload() payload: { bookingId: string; userId: string; reason?: string }
  ) {
    return this.refundService.processRefundAsVoucher(
      payload.bookingId,
      payload.userId,
      payload.reason
    );
  }
}
