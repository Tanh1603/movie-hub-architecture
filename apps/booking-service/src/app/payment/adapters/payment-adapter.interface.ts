import { PaymentMethod } from '@movie-hub/shared-types';

export interface PaymentInitiationContext {
  paymentId: string;
  bookingId: string;
  amount: number;
  ipAddr: string;
  expiresAt: Date;
  returnUrl?: string;
  cancelUrl?: string;
  idempotencyKey: string;
  traceId: string;
}

export interface PaymentInitiationResult {
  paymentUrl: string;
  externalTransactionRef?: string;
  providerMetadata?: Record<string, unknown>;
}

export interface PaymentCallbackParseResult {
  validSignature: boolean;
  orderId?: string;
  transactionId?: string;
  amount?: number;
  isSuccess?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface PaymentReturnParseResult {
  validSignature: boolean;
  responseCode?: string;
}

export type PaymentIpnOutcome =
  | 'invalid_signature'
  | 'order_not_found'
  | 'expired'
  | 'amount_invalid'
  | 'already_processed'
  | 'processed'
  | 'internal_error';

export interface PaymentAdapter {
  readonly method: PaymentMethod;
  initiatePayment(context: PaymentInitiationContext): Promise<PaymentInitiationResult>;
  parseIPN(params: Record<string, string>): PaymentCallbackParseResult;
  parseReturn(params: Record<string, string>): PaymentReturnParseResult;
  buildIPNResponse(outcome: PaymentIpnOutcome): Record<string, unknown>;
  buildReturnResponse(parsed: PaymentReturnParseResult): { status: string; code: string };
}
