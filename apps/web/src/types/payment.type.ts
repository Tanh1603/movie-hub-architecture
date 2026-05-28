
import { RefundStatus } from '@movie-hub/shared-types/booking/enum';

export { RefundStatus };

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  MOMO = 'MOMO',
  ZALOPAY = 'ZALOPAY',
  VNPAY = 'VNPAY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
}
export interface PaymentMethodUI {
  method: PaymentMethod;
  supported: boolean;
  logo: string;
}

export const paymentMethods: PaymentMethodUI[] = [
  {
    method: PaymentMethod.VNPAY,
    supported: true,
    logo: '/logo/vnpay.png',
  },
  {
    method: PaymentMethod.ZALOPAY,
    supported: true,
    logo: '/logo/zalo-pay.png',
  },
  {
    method: PaymentMethod.MOMO,
    supported: false,
    logo: '/logo/momo.png',
  },
];
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}



export interface PaymentDetailDto {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  providerTransactionId?: string;
  paymentUrl?: string;
  paidAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  refundedAt?: string | Date;
  createdAt: string | Date;
}
