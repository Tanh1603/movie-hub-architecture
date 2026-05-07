import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  SERVICE_NAME,
  RefundMessage,
  CreateRefundDto,
  FindAllRefundsDto,
  ProcessRefundDto,
  ApproveRefundDto,
  RejectRefundDto,
} from '@movie-hub/shared-types';

@Injectable()
export class RefundService {
  constructor(
    @Inject(SERVICE_NAME.BOOKING) private readonly bookingClient: ClientProxy
  ) {}

  async createRefund(createRefundDto: CreateRefundDto) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(RefundMessage.CREATE, { dto: createRefundDto })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findAll(filters: FindAllRefundsDto) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(RefundMessage.FIND_ALL, { filters })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findOne(id: string) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(RefundMessage.FIND_ONE, { id })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findByPayment(paymentId: string) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(RefundMessage.FIND_BY_PAYMENT, { paymentId })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async processRefund(processRefundDto: ProcessRefundDto) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(RefundMessage.PROCESS, {
          refundId: processRefundDto.refundId,
        })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async approveRefund(approveRefundDto: ApproveRefundDto) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(RefundMessage.APPROVE, {
          refundId: approveRefundDto.refundId,
        })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async rejectRefund(rejectRefundDto: RejectRefundDto) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(RefundMessage.REJECT, {
          refundId: rejectRefundDto.refundId,
          reason: rejectRefundDto.reason,
        })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  /**
   * Process a refund as voucher (24-hour policy)
   * Returns a voucher code for 100% of ticket value
   */
  async processAsVoucher(bookingId: string, userId: string, reason?: string) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(RefundMessage.PROCESS_VOUCHER, {
          bookingId,
          userId,
          reason,
        })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
