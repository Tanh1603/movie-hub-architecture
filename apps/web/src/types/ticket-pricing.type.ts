import type { DayType, Hall, SeatType } from './cinema.type';

export interface TicketPricing {
  id: string;
  hallId: string;
  hall?: Hall;
  seatType: SeatType;
  dayType: DayType;
  price: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface UpdateTicketPricingRequest {
  price: number;
}

export interface TicketPricingFiltersParams {
  hallId?: string;
  seatType?: SeatType;
  dayType?: DayType;
}
