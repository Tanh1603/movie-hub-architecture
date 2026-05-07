import { BookingStatus, PaymentStatus } from '../../enum';

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

//Extented summary with breakdown
export interface BookingCalculationDto {
  // Booking ID
  bookingId: string;

  // Movie & Showtime Info
  movie: {
    id: string;
    title: string;
    posterUrl?: string;
    duration: number;
    rating: string;
  };

  cinema: {
    id: string;
    name: string;
    address: string;
    hallName: string;
  };

  showtime: {
    id: string;
    startTime: Date;
    endTime: Date;
    format: string; // 2D, 3D, IMAX
    language: string;
  };

  // Tickets grouped by type
  ticketGroups: Array<{
    ticketType: string;
    quantity: number;
    pricePerTicket: number;
    subtotal: number;
    seats: Array<{
      seatId: string;
      row: string;
      number: number;
      seatType: string;
    }>;
  }>;

  // Concessions
  concessions: ConcessionInfoDto[];

  // Price Breakdown
  pricing: {
    ticketsSubtotal: number;
    concessionsSubtotal: number;
    subtotal: number;

    // Tax
    tax: {
      vatRate: number;
      vatAmount: number;
    };

    // Discounts
    promotionDiscount?: {
      code: string;
      description: string;
      discountAmount: number;
    };

    loyaltyPointsDiscount?: {
      pointsUsed: number;
      discountAmount: number;
    };

    totalDiscount: number;
    totalBeforeTax: number;
    finalAmount: number;
  };

  // Loyalty Points
  loyaltyPoints?: {
    used: number;
    willEarn: number;
    currentBalance: number;
    newBalance: number;
  };

  // Payment Information (available pending payment)
  payment?: {
    id: string;
    amount: number;
    paymentMethod?: string;
    paymentUrl?: string;
    status: string;
    createdAt: Date;
  };

  // Metadata
  bookingCode: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  expiresAt?: Date;
}
