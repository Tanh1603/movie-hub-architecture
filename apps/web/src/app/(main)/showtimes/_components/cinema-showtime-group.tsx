'use client';

import { CinemaShowtimeGroup as CinemaShowtimeGroupType } from '@/libs/types/movie.type';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { MapPin, Ticket } from 'lucide-react';

interface Props {
  cinemaGroup: CinemaShowtimeGroupType;
}

export const CinemaShowtimeGroup = ({ cinemaGroup }: Props) => {
  const router = useRouter();

  const groupedShowtimes = useMemo(() => {
    if (!cinemaGroup.showtimes) return {};
    return cinemaGroup.showtimes.reduce((acc, s) => {
      const key = s.format || '2D';
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    }, {} as Record<string, typeof cinemaGroup.showtimes>);
  }, [cinemaGroup]);

  const handleBook = (showtimeId: string) => {
    router.push(`/showtimes/${showtimeId}`);
  };

  if (!cinemaGroup.showtimes || cinemaGroup.showtimes.length === 0) return null;

  // Format badge colors
  const getFormatStyle = (format: string) => {
    switch (format.toUpperCase()) {
      case 'IMAX':
        return 'from-blue-500 to-cyan-500 shadow-blue-500/30';
      case '3D':
        return 'from-emerald-500 to-teal-500 shadow-emerald-500/30';
      case '4DX':
        return 'from-orange-500 to-amber-500 shadow-orange-500/30';
      default:
        return 'from-slate-500 to-slate-600 shadow-slate-500/30';
    }
  };

  return (
    <div className="group mb-5 last:mb-0 pb-5 border-b border-white/5 last:border-0">
      {/* Cinema Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/20">
          <MapPin className="w-4 h-4 text-purple-400" />
        </div>
        <h4 className="text-lg font-bold text-transparent bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300 bg-clip-text tracking-wide">
          {cinemaGroup.name}
        </h4>
      </div>

      {/* Showtimes by format */}
      <div className="space-y-4 ml-12">
        {Object.entries(groupedShowtimes).map(([format, times]) => (
          <div
            key={format}
            className="flex flex-col sm:flex-row sm:items-start gap-3"
          >
            {/* Format badge */}
            <span
              className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider
              rounded-lg text-white shadow-lg whitespace-nowrap
              bg-gradient-to-r ${getFormatStyle(format)}
            `}
            >
              <Ticket className="w-3 h-3" />
              {format}
            </span>

            {/* Time buttons */}
            <div className="flex flex-wrap gap-2">
              {times
                .sort(
                  (a, b) =>
                    new Date(a.startTime).getTime() -
                    new Date(b.startTime).getTime()
                )
                .map((showtime) => {
                  const startTime = new Date(showtime.startTime);
                  const isPast = startTime < new Date();

                  return (
                    <button
                      key={showtime.id}
                      onClick={() =>
                        !isPast && showtime.id && handleBook(showtime.id)
                      }
                      disabled={isPast}
                      className={`
                        group/btn relative px-4 py-2 text-sm font-semibold rounded-lg
                        transition-all duration-300 ease-out overflow-hidden
                        ${
                          isPast
                            ? 'bg-slate-800/50 text-slate-600 border border-slate-700/50 cursor-not-allowed line-through'
                            : `
                              bg-slate-800/80 text-white border border-white/10
                              hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20
                              hover:scale-105 active:scale-100
                            `
                        }
                      `}
                    >
                      {/* Hover gradient overlay */}
                      {!isPast && (
                        <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                      )}

                      {/* Time text */}
                      <span
                        className={`relative z-10 ${
                          !isPast ? 'group-hover/btn:text-white' : ''
                        }`}
                      >
                        {startTime.toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'UTC',
                        })}
                      </span>

                      {/* Shine effect on hover */}
                      {!isPast && (
                        <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
