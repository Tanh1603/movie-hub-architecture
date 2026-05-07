'use client';
import { useCallback } from 'react';
import { useGetMovies } from '@/hooks/movie-hooks';
import MovieCard from '../../_components/MovieCard';
import { ErrorFallback } from '@/components/error-fallback';
import { Button } from '@movie-hub/shacdn-ui/button';

interface MovieListProps {
  isShowing: boolean;
  href?: string;
}
export const MovieListSummary = ({ isShowing, href }: MovieListProps) => {
  const { data, isError, error, isLoading, hasNextPage, fetchNextPage } =
    useGetMovies({
      status: isShowing ? 'now_showing' : 'upcoming',
      limit: 12,
    });
  const movies = data?.pages ?? [];

  const handleExpend = useCallback(() => {
    if (hasNextPage) {
      // Load more movies
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage]);

  return (
    <div className="relative md:px-16 lg:px-40 overflow-hidden">
      {isError ? (
        <ErrorFallback message={error.message} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {isLoading ? (
            Array.from({ length: 9 }).map((_, idx) => (
              <MovieCard.Skeleton key={idx} />
            ))
          ) : movies.length === 0 ? (
            <div className="col-span-full text-center py-10 text-gray-500 flex items-center justify-center w-full">
              🎬 Không có phim nào để hiển thị.
            </div>
          ) : (
            movies.map((movie) => <MovieCard key={movie.id} {...movie} />)
          )}
          <div className="col-span-full flex justify-center w-full">
            {hasNextPage && (
              <Button onClick={handleExpend} variant="outline" size="lg">
                Xem thêm
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
