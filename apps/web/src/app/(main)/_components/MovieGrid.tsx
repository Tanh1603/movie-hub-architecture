'use client';

import { useGetMovies } from '@/hooks/movie-hooks';
import { BlurCircle } from '@/components/blur-circle';
import { ErrorFallback } from '@/components/error-fallback';
import { ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import MovieCard from './MovieCard';
import { Button } from '@movie-hub/shacdn-ui/button';

type Props = {
  href: string;
  title: string;
  status: 'now_showing' | 'upcoming';
};

export default function MovieGrid({ href, title, status }: Props) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useGetMovies({ limit: 10, status });

  const movies = data?.pages ?? [];

  return (
    <div className="px-6 w-full">
      <div className="relative flex items-center justify-between pb-10">
        <BlurCircle top="0" right="-80px" />
        <h2 className="text-2xl md:text-[32px] font-bold text-white uppercase tracking-wider relative z-10 border-l-4 border-primary pl-4">
          {title}
        </h2>

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

      <div className="w-full">
        {isError ? (
          <ErrorFallback message={error.message} />
        ) : isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex justify-center">
                <MovieCard.Skeleton />
              </div>
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center justify-center w-full bg-white/5 rounded-2xl border border-white/5">
            <span className="text-4xl mb-4">🎬</span>
            <p className="text-xl">Không có phim nào để hiển thị.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12 w-full">
              {movies.map((movie) => (
                <div key={movie.id} className="flex justify-center w-full">
                  <MovieCard {...movie} />
                </div>
              ))}
            </div>

            {hasNextPage && (
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="mt-8 px-8 py-6 bg-transparent border border-white/20 hover:border-primary text-gray-300 hover:text-primary hover:bg-white/5 rounded-full uppercase tracking-widest font-bold transition-all"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isFetchingNextPage ? 'Đang tải...' : 'Xem thêm'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
