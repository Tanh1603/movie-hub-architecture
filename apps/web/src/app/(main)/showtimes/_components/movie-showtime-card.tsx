'use client';

import { MovieWithCinemaAndShowtimeResponse } from '@/libs/types/movie.type';
import Image from 'next/image';
import Link from 'next/link';
import { CinemaShowtimeGroup } from './cinema-showtime-group';
import { Clock } from 'lucide-react';

interface Props {
  movie: MovieWithCinemaAndShowtimeResponse;
}

export const MovieShowtimeCard = ({ movie }: Props) => {
  return (
    <div className="group relative flex flex-col md:flex-row gap-6 p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 border border-white/10 hover:border-purple-400/30 transition-all duration-300 backdrop-blur-sm shadow-xl hover:shadow-purple-500/10">
      {/* Gradient accent on left edge */}
      <div className="absolute left-0 top-6 bottom-6 w-1 rounded-full bg-gradient-to-b from-purple-500 via-fuchsia-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity" />

      {/* Poster */}
      <div className="flex-shrink-0 w-full md:w-[200px] ml-2">
        <Link
          href={`/movies/${movie.id}`}
          className="block relative aspect-[2/3] w-full overflow-hidden rounded-xl shadow-2xl group/poster"
        >
          {/* Poster glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl blur-xl opacity-0 group-hover/poster:opacity-100 transition-opacity duration-500" />

          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            className="object-cover transition-all duration-500 group-hover/poster:scale-110 group-hover/poster:brightness-110"
            sizes="(max-width: 768px) 100vw, 200px"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity" />

          {/* View details hint */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover/poster:translate-y-0 transition-transform duration-300">
            <span className="text-xs font-semibold text-white bg-purple-500/80 px-2 py-1 rounded-full">
              Xem chi tiết
            </span>
          </div>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="mb-5">
          <Link
            href={`/movies/${movie.id}`}
            className="group/title inline-block"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-white group-hover/title:text-transparent group-hover/title:bg-gradient-to-r group-hover/title:from-purple-400 group-hover/title:to-pink-400 group-hover/title:bg-clip-text transition-all duration-300 mb-3">
              {movie.title}
            </h3>
          </Link>

          {/* Movie info badges */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Age rating badge */}
            <span className="px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30">
              {movie.ageRating}
            </span>

            {/* Runtime */}
            <span className="flex items-center gap-1.5 px-3 py-1 text-sm text-slate-300 bg-slate-700/50 rounded-lg border border-white/5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              {movie.runtime} phút
            </span>

            {/* Genres */}
            {movie.genre && movie.genre.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {movie.genre.slice(0, 3).map((g) => (
                  <span
                    key={g.name}
                    className="px-3 py-1 text-xs font-medium text-purple-300 bg-purple-500/10 rounded-lg border border-purple-500/20"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cinemas List */}
        <div className="relative rounded-xl bg-slate-800/40 border border-white/5 overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />

          <div className="relative p-5 max-h-[380px] overflow-y-auto custom-scroll">
            {movie.cinemas && movie.cinemas.length > 0 ? (
              <div className="space-y-1">
                {movie.cinemas.map((cinemaGroup) => (
                  <CinemaShowtimeGroup
                    key={cinemaGroup.cinemaId}
                    cinemaGroup={cinemaGroup}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 italic">
                  Chưa có lịch chiếu cho ngày này.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
