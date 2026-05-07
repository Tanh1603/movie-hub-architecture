'use client';
import { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { CinemaLocationResponse } from '@/libs/types/cinema.type';
import { useGetMovieShowtimesAtCinema } from '@/hooks/cinema-hooks';
import { Skeleton } from '@movie-hub/shacdn-ui/skeleton';

interface CinemaShowtimeProps {
  movieId: string;
  cinema: CinemaLocationResponse;
  selectedDate: string; // YYYY-MM-DD
  onSelectShowtime: (showtimeId: string) => void;
  selectedShowtime: string | null;
}

export const CinemaShowtime = ({
  movieId,
  cinema,
  selectedDate,
  onSelectShowtime,
  selectedShowtime,
}: CinemaShowtimeProps) => {
  const [isOpen, setIsOpen] = useState(true);

  // Query showtimes theo ngày
  const { data: showtimes, isLoading } = useGetMovieShowtimesAtCinema(
    cinema.id,
    movieId,
    { date: selectedDate }
  );

  const handleClick = (showtimeId: string) => {
    onSelectShowtime(showtimeId);
  };

  // 🔹 Group showtimes by format
  const groupedShowtimes = useMemo(() => {
    if (!showtimes) return {};
    return showtimes.reduce((acc, s) => {
      const key = s.format; // hoặc s.format nếu có
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    }, {} as Record<string, typeof showtimes>);
  }, [showtimes]);

  return (
    <div className="bg-slate-200/5 border border-slate-200/10 text-white rounded-lg overflow-hidden transition-all w-full">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-200/10 transition-colors w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <p className="text-slate-100 font-bold text-lg">{cinema.name}</p>
          <p className="text-sm text-neutral-300">{cinema.address}</p>
        </div>
        {isOpen ? (
          <ChevronUpIcon className="text-slate-300" />
        ) : (
          <ChevronDownIcon className="text-slate-300" />
        )}
      </div>

      {/* Content */}
      {isOpen && (
        <div className="p-4 border-t border-slate-200/10 space-y-5">
          {isLoading ? (
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-8 w-16 rounded-md bg-slate-200/10"
                />
              ))}
            </div>
          ) : !showtimes || showtimes.length === 0 ? (
            <p className="text-neutral-400">Không có suất chiếu nào</p>
          ) : (
            Object.entries(groupedShowtimes).map(([format, times]) => (
              <div key={format}>
                <p className="font-semibold text-slate-300 mb-3">{format}</p>
                <div className="flex flex-wrap gap-3">
                  {times.map((s) => {
                    const start = new Date(s.startTime);
                    const now = new Date();
                    const disabled = start < now; // disable nếu giờ chiếu đã qua

                    return (
                      <button
                        key={s.id}
                        onClick={() => !disabled && s.id && handleClick(s.id)}
                        disabled={disabled}
                        className={`border rounded-md px-3 py-1 transition-all ${
                          disabled
                            ? 'text-gray-100 bg-neutral-500 cursor-not-allowed'
                            : selectedShowtime === s.id
                            ? 'bg-primary text-white border-primary'
                            : 'text-slate-200 border-slate-200/20 hover:bg-primary/20 hover:text-white hover:border-primary'
                        }`}
                      >
                        {start.toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'UTC',
                        })}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

CinemaShowtime.Skeleton = function CinemaShowtimeSkeleton() {
  return (
    <div className="p-4 border-t border-slate-200/10 space-y-5">
      {/* Tiêu đề phòng chiếu */}
      <Skeleton className="h-4 w-32 rounded bg-slate-200/10" />
      {/* Các nút giờ chiếu giả lập */}
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-md bg-slate-200/10" />
        ))}
      </div>
    </div>
  );
};
