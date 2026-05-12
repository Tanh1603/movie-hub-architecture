import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  SERVICE_NAME,
  UserDetailDto,
  UserMessage,
} from '@movie-hub/shared-types';
import { firstValueFrom, timeout } from 'rxjs';
import { PaymentProviderAdapter } from './payment-provider.adapter';

@Injectable()
export class TcpPaymentProviderAdapter extends PaymentProviderAdapter {
  private readonly logger = new Logger(TcpPaymentProviderAdapter.name);
  private readonly maxAttempts = 3;
  private readonly retryBackoffMs = [1000, 2000, 4000];
  private readonly internalCallTimeoutMs = 10000;
  private readonly healthCallTimeoutMs = 2000;

  constructor(
    @Inject(SERVICE_NAME.USER) private readonly userClient: ClientProxy
  ) {
    super();
  }

  async getUserDetail(userId: string): Promise<UserDetailDto> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await firstValueFrom(
          this.userClient
            .send<UserDetailDto>(UserMessage.GET_USER_DETAIL, userId)
            .pipe(timeout(this.internalCallTimeoutMs))
        );
      } catch (error) {
        lastError = error;

        if (!this.isRetryableError(error) || attempt === this.maxAttempts) {
          throw error;
        }

        this.logger.warn(
          `Retrying user detail call. attempt=${attempt + 1}/${
            this.maxAttempts
          } userId=${userId}`
        );

        await this.sleep(this.retryBackoffMs[attempt - 1]);
      }
    }

    throw lastError;
  }

  private isRetryableError(error: unknown): boolean {
    const errorAsRecord = error as Record<string, unknown>;
    const code =
      typeof errorAsRecord?.code === 'string' ? errorAsRecord.code : '';

    if (
      code === 'ECONNRESET' ||
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT'
    ) {
      return true;
    }

    if ((error as { name?: string })?.name === 'TimeoutError') {
      return true;
    }

    const statusCode = this.extractStatusCode(errorAsRecord);
    if (statusCode === undefined) {
      return false;
    }

    if (statusCode >= 400 && statusCode < 500) {
      return false;
    }

    return statusCode >= 500;
  }

  private extractStatusCode(
    error: Record<string, unknown>
  ): number | undefined {
    const directStatus = error.status;
    if (typeof directStatus === 'number') {
      return directStatus;
    }

    const response = error.response as Record<string, unknown> | undefined;
    if (!response) {
      return undefined;
    }

    const responseStatus = response.status;
    if (typeof responseStatus === 'number') {
      return responseStatus;
    }

    const statusCode = response.statusCode;
    if (typeof statusCode === 'number') {
      return statusCode;
    }

    return undefined;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
