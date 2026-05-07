import { Button } from '@movie-hub/shacdn-ui/button';
import { BookingSummaryDto } from '@/libs/types/booking.type';
import { format } from 'date-fns';
import Link from 'next/link';

interface BookingCardProps {
  booking: BookingSummaryDto;
}

export default function BookingCard({ booking }: BookingCardProps) {
  return (
    <div className="bg-slate-200/10 border border-slate-200/10 text-white shadow-md rounded-lg p-6 flex flex-col md:flex-row justify-between gap-4 w-full lg:max-w-xl hover:bg-slate-200/20 transition-colors duration-300">
      <div className="flex-1 min-w-0">
        <h2 className="text-slate-100 text-xl font-bold line-clamp-2 break-words">
          {booking.movieTitle}
        </h2>
        <p className="text-slate-300">
          {booking.cinemaName} - {booking.hallName}
        </p>
        <p className="text-slate-400">
          {format(new Date(booking.createdAt), 'dd/MM/yyyy HH:mm')} | Ghế:{' '}
          {booking.seatCount}
        </p>
      </div>

      <div className="flex flex-col items-end justify-between gap-2">
        <p className="text-slate-300 font-medium">
          Mã đặt: {booking.bookingCode}
        </p>
        <p className="font-bold text-lg text-slate-100">
          {booking.totalAmount.toLocaleString('vi-VN', {
            style: 'currency',
            currency: 'VND',
          })}
        </p>

        <Link href={`/my-booking/${booking.id}`}>
          <Button className="mt-2" variant="secondary">
            Chi tiết
          </Button>
        </Link>
      </div>
    </div>
  );
}
