/**
 * Event published when a booking is completed and payment is confirmed
 * Channel: booking.confirmed
 * 
 * Published by: Booking Service (PaymentService)
 * */
export interface BookingConfirmedEvent {
  /**
   * The ID of the user who made the booking
   */
  userId: string;

  /**
   * The ID of the showtime for the booking
   */
  showtimeId: string;

  /**
   * The unique ID of the completed booking
   */
  bookingId: string;

  /**
   * Array of seat IDs that were booked
   */
  seatIds: string[];

  _meta?: {
    correlationId: string;
    requestId: string;
    userId?: string;
  };
}
