'use client';
import { BlurCircle } from '@/components/blur-circle';
import { ShowtimeSeatResponse } from '@/types/showtime.type';
import { useBookingStore } from '@/stores/booking-store';
import { CinemaScreen } from './_components/cinema-screen';
import { SeatGrid } from './_components/seat-grid';
import { SeatLegend } from './_components/seat-legend';
import { TicketTypeList } from './_components/ticket-price-list';
import { Loader } from '@/components/loader';

export const SeatMap = ({ data }: { data?: ShowtimeSeatResponse }) => {
  const {
    seatMap,
    seatReservationStatus,
    seatHeldByUser,
    selectedSeats,
    tickets,
    toggleSeat,
  } = useBookingStore();

  if (!data) {
    return (
      <div className="flex items-center justify-center">
        <Loader size={40} />
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col items-center max-md:mt-10 gap-4">
      <BlurCircle top="-100px" left="-100px" />
      <BlurCircle bottom="0" right="0" />
      <h1 className="text-2xl font-bold text-white">{data.hallName}</h1>
      <CinemaScreen />
      <SeatGrid
        layoutType={data.layoutType}
        seatMap={seatMap}
        selectedSeats={selectedSeats}
        seatHeldByUser={seatHeldByUser}
        seatReservationStatus={seatReservationStatus}
        onSeatClick={toggleSeat}
      />
      <SeatLegend />
      <TicketTypeList tickets={tickets} />
    </div>
  );
};
