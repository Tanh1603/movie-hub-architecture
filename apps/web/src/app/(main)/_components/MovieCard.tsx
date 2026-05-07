'use client';

import { AgeRatingEnum, LanguageOptionEnum } from '@movie-hub/shared-types';
import { Clock, Globe } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

type Props = {
  id: string;
  title: string;
  posterUrl: string;
  runtime: number;
  ageRating: AgeRatingEnum;
  productionCountry: string;
  languageType: LanguageOptionEnum;
};

export default function MovieCard({
  id,
  title,
  posterUrl,
  runtime,
  ageRating,
  productionCountry,
  languageType,
}: Props) {
  const router = useRouter();

  const onClickDetail = useCallback(() => {
    router.push(`/movies/${id}`);
    scrollTo(0, 0);
  }, [router, id]);

  const safePoster =
    typeof posterUrl === 'string' && posterUrl.trim() !== ''
      ? posterUrl
      : '/images/placeholder-bg.png';

  return (
    <div className="w-full h-full flex flex-col cursor-pointer group relative overflow-hidden rounded-xl shadow-2xl bg-card transform transition-transform duration-300 hover:scale-105">
      {/* Poster Container */}
      <div
        className="relative w-full aspect-[2/3] overflow-hidden"
        onClick={onClickDetail}
      >
        <Image
          src={safePoster}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />

        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80" />

        {/* Permanent Glass Drawer with Info */}
        <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end backdrop-blur-sm bg-black/30 border-t border-white/10 transition-all duration-300 group-hover:bg-black/50">
          <div className="space-y-2">
            <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 tracking-tight">
              {title}
            </h3>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-200">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{runtime}m</span>
              </div>
              <span className="text-white/20">|</span>
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span className="uppercase">{productionCountry}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-medium text-white/90">
                  {ageRating}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-medium text-white/90">
                  {languageType}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button - Slides up or fades in on hover */}
          <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
            <div className="overflow-hidden">
              <div className="mt-3 w-full py-2 bg-primary text-primary-foreground text-center text-xs font-bold uppercase tracking-widest rounded shadow-[0_0_15px_-3px_rgba(102,51,153,0.5)]">
                Book Ticket
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

MovieCard.Skeleton = function MovieCardSkeleton() {
  return (
    <div className="w-48 flex flex-col animate-pulse justify-center items-center">
      <div className="relative w-full h-[280px] rounded-xl bg-gray-800 mb-2" />
      <div className="h-4 w-32 bg-gray-700 rounded" />
    </div>
  );
};
