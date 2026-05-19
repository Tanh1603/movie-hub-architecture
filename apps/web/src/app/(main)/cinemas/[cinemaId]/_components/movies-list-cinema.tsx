'use client';
import { ErrorFallback } from '@/components/error-fallback';
import { useGetMoviesAtCinema } from '@/features/client/cinemas/hooks';
import { Button } from '@movie-hub/shacdn-ui/button';
import { useCallback } from 'react';
import MovieCard from '../../../_components/MovieCard';
import { MovieAtCinemaCard } from './movie-at-cinema-card';

export const MoviesAtCinema = ({ cinemaId }: { cinemaId: string }) => {
  const { data, isError, error, isLoading, hasNextPage, fetchNextPage } =
    useGetMoviesAtCinema(cinemaId, {
      limit: 10,
    });
  const movies = data?.pages ?? [];
  const handleExpend = useCallback(() => {
    if (hasNextPage) {
      // Load more movies
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage]);

  return (
    <div className="w-full flex flex-col gap-6 my-8">
      {isError ? (
        <ErrorFallback message={error.message} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {isLoading ? (
            Array.from({ length: 9 }).map((_, idx) => (
              <MovieCard.Skeleton key={idx} />
            ))
          ) : movies.length === 0 ? (
            <div className="col-span-full text-center py-10 text-gray-500 flex items-center justify-center w-full">
              🎬 Không có phim nào để hiển thị.
            </div>
          ) : (
            movies.map((movie) => (
              <MovieAtCinemaCard key={movie.id} movie={movie} />
            ))
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
