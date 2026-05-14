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

@Injectable()
export class PaymentService {
  constructor(
    @Inject(SERVICE_NAME.BOOKING) private readonly bookingClient: ClientProxy
  ) {}

  async createPayment(
    bookingId: string,
    dto: CreatePaymentDto,
    ipAddr: string
  ) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(PaymentMessage.CREATE, { bookingId, dto, ipAddr })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async getPayment(id: string, userId?: string) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(PaymentMessage.FIND_ONE, { id, userId })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async getPaymentByBooking(bookingId: string) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(PaymentMessage.FIND_BY_BOOKING, { bookingId })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async handleProviderIPN(provider: PaymentMethod, params: Record<string, string>) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(PaymentMessage.PROVIDER_IPN, { provider, params })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async handleProviderReturn(provider: PaymentMethod, params: Record<string, string>) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(PaymentMessage.PROVIDER_RETURN, { provider, params })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  // ==================== ADMIN OPERATIONS ====================

  async adminFindAll(filters: AdminFindAllPaymentsDto) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(PaymentMessage.ADMIN_FIND_ALL, { filters })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findByStatus(
    status: PaymentStatus,
    page?: number,
    limit?: number
  ) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(PaymentMessage.FIND_BY_STATUS, {
          status,
          page,
          limit,
        })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findByDateRange(startDate: Date, endDate: Date, status?: PaymentStatus, page?: number, limit?: number) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(PaymentMessage.FIND_BY_DATE_RANGE, {
          filters: { startDate, endDate, status, page, limit },
        })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async cancelPayment(paymentId: string) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(PaymentMessage.CANCEL, { paymentId })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async getStatistics(filters: {
    startDate?: Date;
    endDate?: Date;
    paymentMethod?: string;
  }) {
    try {
      return await firstValueFrom(
        this.bookingClient.send(PaymentMessage.GET_STATISTICS, {
          filters,
        })
      );
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
