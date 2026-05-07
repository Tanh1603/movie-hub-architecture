'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@movie-hub/shacdn-ui/card';
import { formatPrice } from '@/app/utils/format-price';
import { ExpiredModal } from '@/components/modal/expire-modal';
import { useGetSessionTTL } from '@/hooks/showtime-hooks';
import { ShowtimeSeatResponse } from '@/libs/types/showtime.type';
import { useBookingStore } from '@/stores/booking-store';
import { CalendarDays } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TicketPreview({
  data,
}: {
  data?: ShowtimeSeatResponse;
}) {
  const router = useRouter();
  const {
    updateHoldTimeSeconds,
    selectedSeats,
    buildPreviewData,
    holdTimeSeconds,
  } = useBookingStore();
  const { data: ttlResponse } = useGetSessionTTL(data?.showtime.id || '');

  useEffect(() => {
    if (ttlResponse?.data) {
      updateHoldTimeSeconds(ttlResponse.data);
    }
  }, [ttlResponse, updateHoldTimeSeconds]);

  const preview = buildPreviewData();

  const [timeLeft, setTimeLeft] = useState(holdTimeSeconds);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  return (
    <>
      {expired && (
        <ExpiredModal
          onConfirm={() => {
            router.replace(`/movies/${data?.showtime.movieId}`); // hoặc route phim
          }}
        />
      )}
      <Card className="bg-rose-500/10 border border-rose-500/20">
        {/* Header */}
        <CardHeader className="pb-4 border-b border-rose-500/20">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg text-rose-400 font-bold">
              {data?.showtime.movieTitle || '—'}
            </CardTitle>
            <div
              className={`text-center font-semibold p-2 rounded ${
                timeLeft <= 60
                  ? 'bg-red-200 text-red-700 animate-pulse'
                  : 'bg-red-100 text-red-700'
              }`}
              style={{ width: '12rem', fontFamily: 'monospace' }}
            >
              Giữ vé còn: {formatTime(timeLeft)}
            </div>
          </div>

          <CardDescription className="text-sm text-neutral-400">
            <div className="flex items-center gap-2 text-neutral-300">
              <CalendarDays className="w-4 h-4 text-rose-500" />
              <span suppressHydrationWarning>
                {data?.showtime.start_time
                  ? (() => {
                      // Manual UTC to Vietnam time conversion to bypass all timezone issues
                      const utcDate = new Date(data.showtime.start_time);
                      // Create a new date that represents Vietnam time (UTC+7)
                      const vnDate = new Date(
                        utcDate.getTime() + 7 * 60 * 60 * 1000
                      );

                      // Format manually to ensure no timezone conversion
                      const hours = vnDate
                        .getUTCHours()
                        .toString()
                        .padStart(2, '0');
                      const minutes = vnDate
                        .getUTCMinutes()
                        .toString()
                        .padStart(2, '0');
                      const day = vnDate
                        .getUTCDate()
                        .toString()
                        .padStart(2, '0');
                      const month = (vnDate.getUTCMonth() + 1)
                        .toString()
                        .padStart(2, '0');
                      const year = vnDate.getUTCFullYear();

                      return `${hours}:${minutes} ${day}/${month}/${year}`;
                    })()
                  : '—'}
              </span>
            </div>
            <br />
            {data?.cinemaName} - {data?.hallName}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 mt-4">
          {/* Seats */}
          <div>
            <p className="font-semibold text-sm text-white">Ghế đã chọn:</p>
            <div className="flex gap-2 flex-wrap">
              {selectedSeats.map((s) => (
                <span
                  key={s}
                  className="bg-rose-500/20 px-2 py-1 rounded text-neutral-300 text-sm"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Seat types */}
          {preview.seats.length > 0 && (
            <div>
              <p className="font-semibold text-sm text-white mb-2">Loại vé:</p>
              <div className="space-y-2">
                {preview.seats.map((t: any) => (
                  <div
                    key={t.type}
                    className="flex justify-between bg-rose-500/20 p-2 rounded text-sm"
                  >
                    <span className="text-neutral-300">
                      {t.type} x{t.quantity}
                    </span>
                    <span className="text-white font-semibold">
                      {formatPrice(t.price * t.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concessions */}
          <div>
            <p className="font-semibold text-sm text-white mb-2">
              Đồ ăn đã chọn:
            </p>

            {preview.concessions.length === 0 ? (
              <p className="text-neutral-500 italic">Không có món nào.</p>
            ) : (
              <div className="space-y-2">
                {preview.concessions.map((c) => (
                  <div
                    key={c.name}
                    className="flex justify-between bg-rose-500/20 p-2 rounded text-sm"
                  >
                    <span className="text-neutral-300">
                      {c.name} x{c.quantity}
                    </span>
                    <span className="text-white font-semibold ml-2">
                      {formatPrice(c.price * c.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discount */}
          {preview.discountCode && preview.discountAmount > 0 && (
            <div>
              <p className="font-semibold text-sm text-white mb-2">
                Mã giảm giá:
              </p>
              <div className="flex justify-between bg-green-500/10 p-2 rounded text-sm">
                <span className="text-green-300">{preview.discountCode}</span>
                <span className="text-green-300">
                  -{formatPrice(preview.discountAmount)}
                </span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-4 border-t border-rose-500/20">
          <div className="flex justify-between items-center w-full">
            <span className="font-semibold text-white">Tổng cộng:</span>
            <span className="font-bold text-lg text-neutral-300">
              {formatPrice(preview.total)}
            </span>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
