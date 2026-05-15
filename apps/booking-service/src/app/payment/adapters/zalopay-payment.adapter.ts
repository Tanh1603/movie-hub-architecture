import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '@movie-hub/shared-types';
import * as crypto from 'crypto';
import {
  PaymentAdapter,
  PaymentCallbackParseResult,
  PaymentIpnOutcome,
  PaymentInitiationContext,
  PaymentInitiationResult,
  ProviderAuthoritativeStatus,
  PaymentReturnParseResult,
} from './payment-adapter.interface';

@Injectable()
export class ZaloPayPaymentAdapter implements PaymentAdapter {
  readonly method = PaymentMethod.ZALOPAY;

  constructor(private readonly configService: ConfigService) {}

  async initiatePayment(
    context: PaymentInitiationContext
  ): Promise<PaymentInitiationResult> {
    const appId = this.getRequiredConfig('ZALOPAY_APP_ID');
    const key1 = this.getRequiredConfig('ZALOPAY_KEY1');
    const createOrderUrl = this.getRequiredConfig('ZALOPAY_CREATE_ORDER_URL');
    const callbackUrl = this.getRequiredConfig('ZALOPAY_CALLBACK_URL');
    const returnUrl = this.getRequiredConfig('ZALOPAY_RETURN_URL');

    const appTransId = this.buildAppTransId(context.paymentId);
    const appUser = context.bookingId;
    const appTime = Date.now();
    const amount = Math.trunc(context.amount);
    const embedData = JSON.stringify({
      redirecturl: returnUrl,
      bookingId: context.bookingId,
      paymentId: context.paymentId,
    });
    const item = '[]';
    const description = `MovieHub payment ${context.paymentId}`;

    const dataToSign = [
      appId,
      appTransId,
      appUser,
      amount,
      appTime,
      embedData,
      item,
    ].join('|');
    const mac = crypto
      .createHmac('sha256', key1)
      .update(dataToSign)
      .digest('hex');

    const body = new URLSearchParams({
      app_id: appId,
      app_user: appUser,
      app_time: String(appTime),
      amount: String(amount),
      app_trans_id: appTransId,
      embed_data: embedData,
      item,
      description,
      bank_code: '',
      callback_url: callbackUrl,
      mac,
    });

    const response = await fetch(createOrderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const payload = (await response.json()) as {
      return_code?: number;
      return_message?: string;
      order_url?: string;
      zp_trans_token?: string;
      order_token?: string;
    };

    if (!response.ok || payload.return_code !== 1 || !payload.order_url) {
      throw new Error(
        `ZALOPAY_INIT_FAILED:${payload.return_code ?? 'UNKNOWN'}:${
          payload.return_message ?? 'unable to create order'
        }`
      );
    }

    return {
      paymentUrl: payload.order_url,
      externalTransactionRef: appTransId,
      providerMetadata: {
        provider: 'ZALOPAY',
        appTransId,
        zpTransToken: payload.zp_trans_token,
        orderToken: payload.order_token,
      },
    };
  }

  parseIPN(params: Record<string, string>): PaymentCallbackParseResult {
    const data = params.data;
    const mac = params.mac;
    if (!data || !mac) {
      return {
        validSignature: false,
        errorCode: '-1',
        errorMessage: 'Missing callback payload',
      };
    }

    const key2 = this.getRequiredConfig('ZALOPAY_KEY2');
    const computedMac = crypto
      .createHmac('sha256', key2)
      .update(data)
      .digest('hex');
    if (computedMac !== mac) {
      return {
        validSignature: false,
        errorCode: '-1',
        errorMessage: 'Invalid mac',
      };
    }

    let decoded: Record<string, unknown>;
    try {
      decoded = JSON.parse(data) as Record<string, unknown>;
    } catch {
      return {
        validSignature: false,
        errorCode: '-1',
        errorMessage: 'Invalid data payload',
      };
    }

    const appTransId = String(decoded.app_trans_id || '');
    const amount = Number(decoded.amount || 0);
    const providerStatus = Number(decoded.status || 0);
    const zpTransId = String(decoded.zp_trans_id || '');
    const serverTime = Number(decoded.server_time || 0);
    const paymentId = this.extractPaymentIdFromCallbackData(decoded) || appTransId;

    return {
      validSignature: true,
      orderId: paymentId,
      transactionId: zpTransId || appTransId,
      amount,
      isSuccess: providerStatus === 1,
      callbackTimestamp: serverTime > 0 ? serverTime : undefined,
    };
  }

  parseReturn(params: Record<string, string>): PaymentReturnParseResult {
    const checksum = params.checksum;
    const appTransId = params.apptransid || params.app_trans_id;
    const status = params.status || '0';
    const key2 = this.getRequiredConfig('ZALOPAY_KEY2');
    const providedData = params.data || '';

    if (checksum && providedData) {
      const computed = crypto
        .createHmac('sha256', key2)
        .update(providedData)
        .digest('hex');
      return {
        validSignature: checksum === computed,
        responseCode: status,
      };
    }

    return {
      validSignature: Boolean(appTransId),
      responseCode: status,
    };
  }

  buildIPNResponse(outcome: PaymentIpnOutcome): Record<string, unknown> {
    switch (outcome) {
      case 'invalid_signature':
        return { return_code: -1, return_message: 'mac not equal' };
      case 'stale_callback':
      case 'processed':
      case 'already_processed':
        return { return_code: 1, return_message: 'success' };
      case 'order_not_found':
        return { return_code: 2, return_message: 'order not found' };
      case 'amount_invalid':
      case 'expired':
      case 'internal_error':
      default:
        return { return_code: 0, return_message: 'failed' };
    }
  }

  buildReturnResponse(parsed: PaymentReturnParseResult): { status: string; code: string } {
    if (!parsed.validSignature) {
      return { status: 'error', code: '-1' };
    }
    return { status: parsed.responseCode === '1' ? 'success' : 'failed', code: parsed.responseCode || '0' };
  }

  async queryPaymentStatus(providerReference: string): Promise<{
    status: ProviderAuthoritativeStatus;
    providerTransactionId?: string;
  }> {
    const queryUrl = this.configService.get<string>('ZALOPAY_QUERY_ORDER_URL');
    if (!queryUrl) {
      return { status: 'UNKNOWN' };
    }

    const appId = this.getRequiredConfig('ZALOPAY_APP_ID');
    const key1 = this.getRequiredConfig('ZALOPAY_KEY1');
    const macInput = `${appId}|${providerReference}|${key1}`;
    const mac = crypto.createHmac('sha256', key1).update(macInput).digest('hex');

    const body = new URLSearchParams({
      app_id: appId,
      app_trans_id: providerReference,
      mac,
    });

    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    if (!response.ok) {
      return { status: 'UNKNOWN' };
    }

    const payload = (await response.json()) as {
      return_code?: number;
      is_processing?: boolean;
      zp_trans_id?: number | string;
    };

    if (payload.return_code === 1) {
      return {
        status: 'COMPLETED',
        providerTransactionId: payload.zp_trans_id
          ? String(payload.zp_trans_id)
          : undefined,
      };
    }
    if (payload.return_code === 2) {
      return { status: 'FAILED' };
    }
    if (payload.return_code === 3 || payload.is_processing) {
      return { status: 'PENDING' };
    }
    return { status: 'UNKNOWN' };
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`${key} is required`);
    }
    return value;
  }

  private buildAppTransId(paymentId: string): string {
    const vietnamNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const yy = String(vietnamNow.getUTCFullYear()).slice(-2);
    const mm = String(vietnamNow.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(vietnamNow.getUTCDate()).padStart(2, '0');
    const suffix = crypto
      .createHash('sha256')
      .update(paymentId)
      .digest('hex')
      .slice(0, 32);
    // yyMMdd_<suffix>, total length = 39 (<= 40), deterministic per payment
    return `${yy}${mm}${dd}_${suffix}`;
  }

  private extractPaymentIdFromCallbackData(data: Record<string, unknown>): string | undefined {
    const embedDataRaw = data.embed_data;
    if (typeof embedDataRaw !== 'string') {
      return undefined;
    }
    try {
      const embed = JSON.parse(embedDataRaw) as { paymentId?: string };
      return embed.paymentId;
    } catch {
      return undefined;
    }
  }
}
