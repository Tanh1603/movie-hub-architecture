import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  SERVICE_NAME,
  CreatePaymentDto,
  PaymentMessage,
  AdminFindAllPaymentsDto,
  PaymentStatus,
  PaymentMethod,
} from '@movie-hub/shared-types';
import { attachRequestContextToPayload } from '@movie-hub/shared-types/common';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(SERVICE_NAME.BOOKING) private readonly bookingClient: ClientProxy
  ) {}

  private async sendWithContext<T>(
    pattern: string,
    payload: Record<string, unknown>,
    request?: unknown
  ): Promise<T> {
    try {
      return await firstValueFrom(
        this.bookingClient.send(
          pattern,
          attachRequestContextToPayload(
            payload,
            request as Record<string, unknown> | undefined
          )
        )
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async createPayment(
    bookingId: string,
    dto: CreatePaymentDto,
    ipAddr: string,
    userId: string,
    request?: unknown
  ) {
    return this.sendWithContext(
      PaymentMessage.CREATE,
      {
        bookingId,
        dto,
        ipAddr,
        userId,
      },
      request
    );
  }

  async getPayment(id: string, userId?: string, request?: unknown) {
    try {
      return await this.sendWithContext(
        PaymentMessage.FIND_ONE,
        { id, userId },
        request
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async getPaymentByBooking(
    bookingId: string,
    userId: string,
    request?: unknown
  ) {
    return this.sendWithContext(
      PaymentMessage.FIND_BY_BOOKING,
      {
        bookingId,
        userId,
      },
      request
    );
  }

  async handleProviderIPN(
    provider: PaymentMethod,
    params: Record<string, string>,
    request?: unknown
  ) {
    try {
      return await this.sendWithContext(
        PaymentMessage.PROVIDER_IPN,
        { provider, params },
        request
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async handleProviderReturn(
    provider: PaymentMethod,
    params: Record<string, string>,
    request?: unknown
  ) {
    try {
      return await this.sendWithContext(
        PaymentMessage.PROVIDER_RETURN,
        { provider, params },
        request
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  // ==================== ADMIN OPERATIONS ====================

  async adminFindAll(filters: AdminFindAllPaymentsDto, request?: unknown) {
    return this.sendWithContext(
      PaymentMessage.ADMIN_FIND_ALL,
      { filters },
      request
    );
  }

  async findByStatus(
    status: PaymentStatus,
    page?: number,
    limit?: number,
    request?: unknown
  ) {
    return this.sendWithContext(
      PaymentMessage.FIND_BY_STATUS,
      {
        status,
        page,
        limit,
      },
      request
    );
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    status?: PaymentStatus,
    page?: number,
    limit?: number,
    request?: unknown
  ) {
    return this.sendWithContext(
      PaymentMessage.FIND_BY_DATE_RANGE,
      {
        filters: { startDate, endDate, status, page, limit },
      },
      request
    );
  }

  async cancelPayment(paymentId: string, request?: unknown) {
    return this.sendWithContext(PaymentMessage.CANCEL, { paymentId }, request);
  }

  async getStatistics(
    filters: {
      startDate?: Date;
      endDate?: Date;
      paymentMethod?: string;
    },
    request?: unknown
  ) {
    return this.sendWithContext(
      PaymentMessage.GET_STATISTICS,
      {
        filters,
      },
      request
    );
  }
}
