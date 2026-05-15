import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '@movie-hub/shared-types';
import * as crypto from 'crypto';
import * as moment from 'moment';
import * as querystring from 'qs';
import {
  PaymentAdapter,
  PaymentCallbackParseResult,
  PaymentIpnOutcome,
  PaymentInitiationContext,
  PaymentInitiationResult,
  PaymentReturnParseResult,
} from './payment-adapter.interface';

@Injectable()
export class VNPayPaymentAdapter implements PaymentAdapter {
  readonly method = PaymentMethod.VNPAY;

  constructor(private readonly configService: ConfigService) {}

  async initiatePayment(
    context: PaymentInitiationContext
  ): Promise<PaymentInitiationResult> {
    const tmnCode = this.getRequiredConfig('VNPAY_TMN_CODE');
    const hashSecret = this.getRequiredConfig('VNPAY_HASH_SECRET');
    const vnpUrl = this.getRequiredConfig('VNPAY_URL');
    const returnUrl = this.getRequiredConfig('VNPAY_RETURN_URL');

    const createDate = moment.utc().utcOffset('+07:00').format('YYYYMMDDHHmmss');
    const expireDate = moment
      .utc(context.expiresAt)
      .utcOffset('+07:00')
      .format('YYYYMMDDHHmmss');

    const cleanIpAddr = context.ipAddr.replace(/^.*:/, '');

    const vnpParams: Record<string, string | number> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: context.paymentId,
      vnp_OrderInfo: `Thanh toan cho ma GD:${context.paymentId}`,
      vnp_OrderType: 'other',
      vnp_Amount: context.amount * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: cleanIpAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    const sortedParams = this.sortObject(
      Object.fromEntries(Object.entries(vnpParams).map(([k, v]) => [k, String(v)]))
    );

    const signData = querystring.stringify(sortedParams, { encode: false });
    const signed = crypto
      .createHmac('sha512', hashSecret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    sortedParams.vnp_SecureHash = signed;

    return {
      paymentUrl: `${vnpUrl}?${querystring.stringify(sortedParams, { encode: false })}`,
      externalTransactionRef: context.paymentId,
      providerMetadata: {
        provider: 'VNPAY',
        traceId: context.traceId,
      },
    };
  }

  parseIPN(params: Record<string, string>): PaymentCallbackParseResult {
    const secureHash = params.vnp_SecureHash;
    const paramsToVerify = { ...params };
    delete paramsToVerify.vnp_SecureHash;
    delete paramsToVerify.vnp_SecureHashType;

    const sortedParams = this.sortObject(paramsToVerify);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const signed = crypto
      .createHmac('sha512', this.getRequiredConfig('VNPAY_HASH_SECRET'))
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    if (secureHash?.toUpperCase() !== signed?.toUpperCase()) {
      return {
        validSignature: false,
        errorCode: '97',
        errorMessage: 'Checksum failed',
      };
    }

    return {
      validSignature: true,
      orderId: params.vnp_TxnRef,
      transactionId: params.vnp_TransactionNo,
      amount: Number.parseInt(params.vnp_Amount || '0', 10) / 100,
      isSuccess: params.vnp_TransactionStatus === '00',
      callbackTimestamp: this.parseVnpayDate(params.vnp_PayDate || params.vnp_CreateDate),
    };
  }

  parseReturn(params: Record<string, string>): PaymentReturnParseResult {
    const secureHash = params.vnp_SecureHash;
    const paramsToVerify = { ...params };
    delete paramsToVerify.vnp_SecureHash;
    delete paramsToVerify.vnp_SecureHashType;

    const sortedParams = this.sortObject(paramsToVerify);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const signed = crypto
      .createHmac('sha512', this.getRequiredConfig('VNPAY_HASH_SECRET'))
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    return {
      validSignature: secureHash?.toUpperCase() === signed?.toUpperCase(),
      responseCode: params.vnp_ResponseCode,
    };
  }

  buildIPNResponse(outcome: PaymentIpnOutcome): Record<string, unknown> {
    switch (outcome) {
      case 'invalid_signature':
        return { RspCode: '97', Message: 'Checksum failed' };
      case 'stale_callback':
        return { RspCode: '02', Message: 'This order has been updated to the payment status' };
      case 'order_not_found':
        return { RspCode: '01', Message: 'Order not found' };
      case 'expired':
        return { RspCode: '04', Message: 'Order expired' };
      case 'amount_invalid':
        return { RspCode: '04', Message: 'Amount invalid' };
      case 'already_processed':
        return {
          RspCode: '02',
          Message: 'This order has been updated to the payment status',
        };
      case 'processed':
        return { RspCode: '00', Message: 'Success' };
      case 'internal_error':
      default:
        return { RspCode: '99', Message: 'Update failed' };
    }
  }

  buildReturnResponse(parsed: PaymentReturnParseResult): { status: string; code: string } {
    if (!parsed.validSignature) {
      return { status: 'error', code: '97' };
    }
    return { status: 'success', code: parsed.responseCode || '00' };
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`${key} is required`);
    }
    return value;
  }

  private sortObject(obj: Record<string, string>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys: string[] = [];

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        keys.push(encodeURIComponent(key));
      }
    }

    keys.sort();

    for (const encodedKey of keys) {
      const originalKey = Object.keys(obj).find(
        (k) => encodeURIComponent(k) === encodedKey
      );
      if (originalKey) {
        sorted[encodedKey] = encodeURIComponent(obj[originalKey]).replace(/%20/g, '+');
      }
    }

    return sorted;
  }

  /**
   * Parse VNPay date format YYYYMMDDHHmmss (ICT/UTC+7) to epoch ms.
   * Returns undefined if the date string is missing or malformed.
   */
  private parseVnpayDate(dateStr?: string): number | undefined {
    if (!dateStr || dateStr.length < 14) {
      return undefined;
    }
    // Format: YYYYMMDDHHmmss — interpreted as UTC+7
    const iso = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T${dateStr.slice(8, 10)}:${dateStr.slice(10, 12)}:${dateStr.slice(12, 14)}+07:00`;
    const ts = new Date(iso).getTime();
    return Number.isNaN(ts) ? undefined : ts;
  }
}
