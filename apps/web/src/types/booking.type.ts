import type { PaginatedResponse, PaginationParams } from './api.type';
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

// ============================================================================
// ADMIN/API TYPES
// ============================================================================

export interface SeatInfo {
  seatId: string;
  row: string;
  number: number;
  seatType: string;
  ticketType: string;
  price: number;
}

export interface ConcessionInfo {
  concessionId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface BookingSummary {
  id: string;
  bookingCode: string;
  showtimeId: string;
  movieTitle: string;
  cinemaName: string;
  hallName: string;
  startTime: string | Date;
  seatCount: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string | Date;
}

export interface BookingDetail extends BookingSummary {
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  seats: SeatInfo[];
  concessions?: ConcessionInfo[];
  subtotal: number;
  discount: number;
  pointsUsed: number;
  pointsDiscount: number;
  finalAmount: number;
  promotionCode?: string;
  paymentStatus: PaymentStatus;
  expiresAt?: string | Date;
  cancelledAt?: string | Date;
  cancellationReason?: string;
  updatedAt: string | Date;
}

export type GetBookingsResponse = PaginatedResponse<BookingSummary>;

export type GetBookingDetailResponse = BookingDetail;

export interface UpdateBookingStatusRequest {
  status: BookingStatus;
  reason?: string;
}

export interface UpdateBookingStatusResponse {
  id: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  updatedAt: string | Date;
}

export interface ConfirmBookingResponse {
  id: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  confirmedAt: string | Date;
}

export interface BookingFiltersParams extends PaginationParams {
  userId?: string;
  showtimeId?: string;
  cinemaId?: string;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string | Date;
  endDate?: string | Date;
  sortBy?: 'created_at' | 'final_amount' | 'expires_at';
  sortOrder?: 'asc' | 'desc';
}
