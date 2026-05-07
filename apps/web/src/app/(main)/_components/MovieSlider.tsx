'use client';

import 'swiper/css';
import 'swiper/css/navigation';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@movie-hub/shacdn-ui/carousel';
import { BlurCircle } from '@/components/blur-circle';
import { useGetMovies } from '@/hooks/movie-hooks';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import MovieCard from './MovieCard';
import { ErrorFallback } from '@/components/error-fallback';

type Props = {
  href: string;
  title: string;
  status: 'now_showing' | 'upcoming';
};

export default function MovieSlider({ href, title, status }: Props) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useGetMovies({ limit: 9, status });

  const movies = data?.pages ?? [];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const ent = entries[0];
        if (ent.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: null,
        rootMargin: '0px 200px 0px 0px',
        threshold: 0,
      } // threshold tuỳ chỉnh
    );

    const el = lastItemRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="px-6">
      <div className="relative flex items-center justify-between pt-20 pb-10">
        <BlurCircle top="0" right="-80px" />
        <p className="text-2xl md:text-[32px] font-bold text-white uppercase tracking-wider relative z-10 border-l-4 border-primary pl-4">
          {title}
        </p>

        <Link
          href={`movies/${href}`}
          className="relative z-10 group flex items-center gap-2 text-sm md:text-base text-white font-bold transition-all cursor-pointer uppercase tracking-wider bg-white/10 px-4 py-2 md:px-6 md:py-3 rounded-full border border-white/20 hover:bg-white hover:text-black"
          prefetch
        >
          <span className="hidden sm:inline">Xem tất cả</span>
          <span className="sm:hidden">Tất cả</span>
          <ArrowRight className="group-hover:translate-x-1 transition w-5 h-5" />
        </Link>
      </div>

      <Carousel className="w-full">
        <CarouselContent ref={containerRef} className="m-0">
          {isError ? (
            <ErrorFallback message={error.message} />
          ) : isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                <MovieCard.Skeleton />
              </CarouselItem>
            ))
          ) : movies.length === 0 ? (
            <div className="text-center py-10 text-gray-500 flex items-center justify-center w-full">
              🎬 Không có phim nào để hiển thị.
            </div>
          ) : (
            movies.map((movie, idx) => {
              const isLast = idx === movies.length - 1;
              return (
                <CarouselItem
                  key={movie.id}
                  ref={isLast ? lastItemRef : undefined}
                  className="basis-1/2 md:basis-1/3 lg:basis-1/6"
                >
                  <MovieCard {...movie} />
                </CarouselItem>
              );
            })
          )}

          {isFetchingNextPage && (
            <CarouselItem className="md:basis-1/2 lg:basis-1/3">
              <MovieCard.Skeleton />
            </CarouselItem>
          )}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext disabled={isFetchingNextPage} />
      </Carousel>
    </div>
  );
}
