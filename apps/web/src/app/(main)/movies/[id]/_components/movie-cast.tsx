'use client';

import Image from 'next/image';

interface Actor {
  name: string;
  profileUrl: string | null;
}
import { Skeleton } from '@movie-hub/shacdn-ui/skeleton'; // hoặc tự tạo nếu bạn chưa có
import { useGetMovieDetail } from '@/features/client/movies/hooks';
import { ErrorFallback } from '@/components/error-fallback';

export const MovieCast = ({ movieId }: { movieId: string }) => {
  const { data, isLoading, isError, error } = useGetMovieDetail(movieId);
  const actors: Actor[] = (data?.data.cast as Actor[]) || [];

  if (isLoading) {
    return (
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-6 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center mx-4"
            >
              <Skeleton className="rounded-full h-[100px] w-[100px]" />
              <Skeleton className="h-4 w-20 mt-3 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-400">
        <ErrorFallback message={error?.message} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto hide-scrollbar">
      <div className="flex items-center gap-4 w-max px-4">
        {actors.length > 0 ? (
          actors.map((actor, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center mx-4"
            >
              <Image
                src={
                  typeof actor?.profileUrl === 'string' &&
                  actor?.profileUrl.trim() !== ''
                    ? actor.profileUrl
                    : '/images/placeholder.png'
                }
                alt={actor?.name || 'Diễn viên'}
                className="rounded-full aspect-square object-cover"
                height={100}
                width={100}
              />
              <p className="text-xl font-medium text-neutral-400 mt-3">
                {actor.name || 'Chưa cập nhật'}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 mt-4">Không có thông tin diễn viên</p>
        )}
      </div>
    </div>
  );
};
