import { BookingCard } from './booking-details-card';

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  return (
    <div className="w-full h-full flex flex-col items-center text-white p-4 gap-4">
      <h1 className="text-3xl font-bold">Chi tiết đặt vé</h1>
      <BookingCard bookingId={bookingId} />
    </div>
  );
}
