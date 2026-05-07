import { PaymentStatus } from './payment.type';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
}

export interface SeatInfoDto {
  seatId: string;
  row: string;
  number: number;
  seatType: string;
  ticketType: string;
  price: number;
}

export interface ConcessionInfoDto {
  concessionId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
export interface BookingSummaryDto {
  id: string;
  bookingCode: string;
  showtimeId: string;
  movieTitle: string;
  cinemaName: string;
  hallName: string;
  startTime: Date;
  seatCount: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: Date;
}

export interface BookingDetailDto extends BookingSummaryDto {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  seats: SeatInfoDto[];
  concessions?: ConcessionInfoDto[];
  subtotal: number;
  discount: number;
  pointsUsed: number;
  pointsDiscount: number;
  finalAmount: number;
  promotionCode?: string;
  paymentStatus: PaymentStatus;
  expiresAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  updatedAt: Date;
  // Refund voucher code (available when status is REFUNDED)
  refundVoucherCode?: string;
}
