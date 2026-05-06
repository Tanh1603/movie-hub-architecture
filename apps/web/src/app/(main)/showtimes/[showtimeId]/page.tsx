import { getShowtimeSeats } from '@/api/services';
import { SeatBooking } from './seat-booking';
import { getQueryClient } from '@/shared/query/get-query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { checkUserBookingAtShowtime, createBooking, getUserBookings } from '@/api/services';
import { BookingStatus } from '@/types/booking.type';



export default async function SeatBookingPage({
  params,
}: {
  params: Promise<{ showtimeId: string }>;
}) {
  
  const { showtimeId } = await params;
  console.log('Showtime ID:', showtimeId);

  const queryClient = getQueryClient();


  // let isExistingBooking;
  // try {
  //   const res = await checkUserBookingAtShowtime(
  //     showtimeId,
  //     'PENDING,CONFIRMED'
  //   );
  //   isExistingBooking = res.data;
  // } catch (err) {
  //   console.error('Error checking existing booking:', err);
  //   isExistingBooking = null; // fallback
  // }
  // if (!isExistingBooking) {
  //   await createBooking({
  //     showtimeId
  //   })
  // }

  await queryClient.prefetchQuery({
    queryKey: ['showtime-seats', showtimeId],
    queryFn: () => getShowtimeSeats(showtimeId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SeatBooking showtimeId={showtimeId} />
    </HydrationBoundary>
  )
}
