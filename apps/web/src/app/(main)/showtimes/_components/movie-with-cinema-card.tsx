'use client';

import { Button } from '@movie-hub/shacdn-ui/button';
import { Card, CardContent } from '@movie-hub/shacdn-ui/card';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type {
  MovieWithCinemaAndShowtimeResponse,
  CinemaShowtimeGroup,
} from '@/libs/types/movie.type';
import { Skeleton } from '@movie-hub/shacdn-ui/skeleton';

// ICONS
import { Theater, Timer, Globe2, Languages, ShieldAlert } from 'lucide-react';

interface MovieWithCinemaCardProps {
  movie: MovieWithCinemaAndShowtimeResponse;
}

export const MovieWithCinemaCard = ({ movie }: MovieWithCinemaCardProps) => {
  const router = useRouter();

  const goToMovieDetail = useCallback(() => {
    router.push(`/movies/${movie.id}`);
  }, [router, movie.id]);

  const goToShowtimeDetail = useCallback(
    (showtimeId?: string) => {
      if (!showtimeId) return;
      router.push(`/showtimes/${showtimeId}`);
    },
    [router]
  );

  const now = useMemo(() => new Date(), []);

  return (
    <Card className="w-full rounded-2xl bg-rose-500/10 border border-rose-500/20 text-gray-200 shadow-xl">
      <CardContent className="grid grid-cols-1 gap-8 p-4 md:grid-cols-[260px,1fr] md:p-6">
        {/* LEFT: Poster + movie info */}
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={goToMovieDetail}
            className="overflow-hidden rounded-2xl focus:outline-none"
          >
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              width={260}
              height={380}
              className="h-auto w-full max-w-[260px] object-cover rounded-xl"
            />
          </button>

          {/* Movie Info */}
          <div className="space-y-3 text-sm text-gray-200">
            <p className="text-lg font-semibold uppercase tracking-wide text-rose-300">
              {movie.title}
            </p>

            <div className="flex gap-2 flex-col text-gray-300 text-sm">
              <span className="flex items-center gap-1">
                <Theater className="w-4 h-4 text-rose-400" />
                {movie.genre.map((g) => g.name).join(', ')}
              </span>

              <span className="flex items-center gap-1">
                <Timer className="w-4 h-4 text-rose-400" />
                {movie.runtime} phút
              </span>

              <span className="flex items-center gap-1">
                <Globe2 className="w-4 h-4 text-rose-400" />
                {movie.productionCountry}
              </span>

              <span className="flex items-center gap-1">
                <Languages className="w-4 h-4 text-rose-400" />
                Ngôn ngữ: {movie.languageType}
              </span>

              <span className="flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                {movie.ageRating}
              </span>
            </div>

            <p className="mt-1 text-xs text-gray-300 line-clamp-3">
              {movie.overview}
            </p>
          </div>
        </div>

        {/* RIGHT: Cinema list */}
        <div className="flex flex-col gap-6">
          {movie.cinemas.map((cinema: CinemaShowtimeGroup, index) => {
            const validTimes = cinema.showtimes.filter((s) => {
              const start = new Date(s.startTime);
              return !!s.id && start >= now;
            });

            const groupedByFormat = validTimes.reduce((acc, s) => {
              const f = s.format;
              if (!acc[f]) acc[f] = [];
              acc[f].push(s);
              return acc;
            }, {} as Record<string, typeof validTimes>);

            return (
              <div
                key={cinema.cinemaId}
                className={`flex flex-col gap-2 border-t border-rose-500/20 pt-4 ${
                  index === 0 ? 'border-t-0 pt-0' : ''
                }`}
              >
                <div>
                  <h3 className="text-base font-semibold text-rose-300">
                    {cinema.name}
                  </h3>
                  <p className="text-xs text-gray-300">{cinema.address}</p>
                </div>

                <div className="mt-2 flex flex-col gap-4 text-xs">
                  {Object.keys(groupedByFormat).length === 0 ? (
                    <p className="text-neutral-400">
                      Không còn suất chiếu phù hợp.
                    </p>
                  ) : (
                    Object.entries(groupedByFormat).map(([format, times]) => (
                      <div key={format} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold uppercase text-rose-400">
                            {format}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {times.map((s) => {
                            const start = new Date(s.startTime);
                            const label = start.toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'UTC',
                            });

                            const disabled = !s.id || start < now;

                            return (
                              <Button
                                key={s.id ?? `${cinema.cinemaId}-${label}`}
                                size="sm"
                                disabled={disabled}
                                onClick={() =>
                                  !disabled && goToShowtimeDetail(s.id)
                                }
                                className={[
                                  'rounded-md border px-4 py-2 text-xs font-semibold',
                                  disabled
                                    ? 'border-rose-800 text-rose-800 cursor-not-allowed'
                                    : 'border-rose-400 bg-transparent text-rose-300 hover:bg-rose-500 hover:text-white',
                                ].join(' ')}
                              >
                                {label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

MovieWithCinemaCard.Skeleton = function MovieWithCinemaCardSkeleton() {
  return (
    <Card className="w-full rounded-2xl bg-rose-500/20 border border-rose-500 text-gray-200 shadow-xl">
      <CardContent className="grid grid-cols-1 gap-8 p-4 md:grid-cols-[260px,1fr] md:p-6">
        {/* LEFT skeleton */}
        <div className="flex flex-col gap-4">
          {/* Poster */}
          <Skeleton className="h-[380px] w-full max-w-[260px] rounded-2xl bg-rose-500/20 border border-rose-500/40" />

          <div className="space-y-3">
            {/* Title */}
            <Skeleton className="h-5 w-48 rounded-md bg-rose-500/20" />

            {/* linha info */}
            <Skeleton className="h-3 w-36 rounded bg-rose-500/15" />
            <Skeleton className="h-3 w-28 rounded bg-rose-500/15" />
            <Skeleton className="h-3 w-32 rounded bg-rose-500/15" />
            <Skeleton className="h-3 w-20 rounded bg-rose-500/15" />
            <Skeleton className="h-3 w-24 rounded bg-rose-500/15" />

            {/* Overview */}
            <Skeleton className="mt-2 h-12 w-full rounded bg-rose-500/10" />
          </div>
        </div>

        {/* RIGHT skeleton (3 rạp + giờ chiếu) */}
        <div className="flex flex-col gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`flex flex-col gap-3 border-t border-rose-500/20 pt-4 ${
                i === 0 ? 'border-t-0 pt-0' : ''
              }`}
            >
              {/* Cinema name */}
              <Skeleton className="h-4 w-56 rounded bg-rose-500/20" />
              <Skeleton className="h-3 w-72 rounded bg-rose-500/15" />

              {/* Showtimes */}
              <div className="mt-2 flex flex-wrap gap-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton
                    key={j}
                    className="h-8 w-16 rounded-xl bg-rose-500/20 border border-rose-500/40"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
