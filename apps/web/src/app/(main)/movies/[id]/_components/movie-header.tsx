'use client';
import { Button } from '@movie-hub/shacdn-ui/button';
import { Skeleton } from '@movie-hub/shacdn-ui/skeleton';
import { GenreResponse, MovieDetailResponse } from '@movie-hub/shared-types';
import {
  CalendarDays,
  Clock,
  FileTextIcon,
  Film,
  Globe2,
  Heart,
  PlayCircleIcon,
  User2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { BlurCircle } from '../../../../../components/blur-circle';
import { useGetMovieDetail } from '@/hooks/movie-hooks';
import { ErrorFallback } from '@/components/error-fallback';
import { useTrailerModal } from '@/stores/trailer-modal-store';

export const MovieHeader = ({ movieId }: { movieId: string }) => {
  const { data, isLoading, isError, error } = useGetMovieDetail(movieId);
  const movieData: MovieDetailResponse | undefined = data?.data;

  const formattedDate = movieData?.releaseDate
    ? new Date(movieData?.releaseDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Chưa rõ ngày phát hành';

  const { openModal } = useTrailerModal();

  return (
    <>
      {isLoading ? (
        <MovieHeader.Skeleton />
      ) : isError || !movieData ? (
        <ErrorFallback message={error?.message} />
      ) : (
        <div className="flex flex-col flex-wrap md:flex-row items-center gap-8 aspect-video rounded-2xl">
          {/* Backdrop */}
          {movieData?.backdropUrl && movieData?.backdropUrl.trim() !== '' ? (
            <Image
              src={movieData.backdropUrl}
              alt={movieData.title}
              fill
              priority
              className="object-cover brightness-20 rounded-2xl"
            />
          ) : (
            <div className="absolute inset-0 bg-gray-900 rounded-2xl" />
          )}
          <div className="absolute inset-0 bg-black/60" />

          {/* Content */}
          <div className=" z-10 flex flex-col md:flex-row items-center gap-8 px-6 md:px-12 py-8">
            <Image
              width={288}
              height={416}
              src={
                movieData.posterUrl && movieData.posterUrl.trim() !== ''
                  ? movieData.posterUrl
                  : '/images/placeholder-bg.png'
              }
              alt={movieData.title}
              className="rounded-xl h-[416px] w-[288px] object-cover shadow-lg"
            />

            <div className="flex flex-1 flex-col gap-3 text-white max-w-2xl">
              <div className="flex items-center gap-2 text-sm text-slate-100 font-bold">
                <span>{movieData.languageType}</span>
                <span>•</span>
                <span>{movieData.ageRating}</span>
                <span>•</span>
                <span>{movieData.productionCountry}</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold">
                {movieData.title}
              </h1>
              {movieData.originalTitle && (
                <p className="text-gray-400 italic text-lg">
                  ({movieData.originalTitle})
                </p>
              )}

              {/* <div className="flex items-center gap-2">
                <StarIcon className="w-5 h-5 text-rose-600 fill-rose-500" />
                <span>{mo</span>
              </div> */}

              <div className="flex items-start gap-2 mt-3 text-gray-300">
                <FileTextIcon className="w-4 h-4 flex-shrink-0 text-slate-100" />
                <p className="text-sm">{movieData.overview}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-100" />
                  <span>{movieData.runtime} phút</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-slate-100" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User2 className="w-4 h-4 text-slate-100" />
                  <span>{movieData.director}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-slate-100" />
                  <span>
                    {movieData.spokenLanguages?.length
                      ? movieData.spokenLanguages.join(', ')
                      : 'Không có thông tin ngôn ngữ'}
                    {movieData.originalLanguage &&
                      ` (${movieData.originalLanguage.toUpperCase()})`}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-300">
                <Film className="inline w-4 h-4 text-slate-100 mr-1" />
                {movieData.genre?.length
                  ? movieData.genre
                      .map((g: GenreResponse) => g.name)
                      .join(' | ')
                  : 'Chưa có thể loại'}
              </p>

              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (movieData.trailerUrl) {
                      openModal(movieData.trailerUrl);
                    }
                  }}
                >
                  <PlayCircleIcon className="w-5 h-5" />
                  {movieData.trailerUrl ? 'Xem Trailer' : 'Trailer chưa có'}
                </Button>

                <Button>
                  <Link
                    href="#dateSelect"
                    className="px-10 py-3 rounded-md text-sm font-medium active:scale-95 transition"
                  >
                    Mua vé
                  </Link>
                </Button>

                <button className="bg-gray-700 p-2.5 rounded-full active:scale-95 transition hover:bg-gray-600">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

MovieHeader.Skeleton = function MovieHeaderSkeleton() {
  return (
    <div className="flex flex-col w-full flex-wrap md:flex-row items-center gap-8 mx-auto aspect-video rounded-2xl relative overflow-hidden bg-gray-900">
      {/* Overlay tối */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />

      {/* Nội dung */}
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 px-6 md:px-12 py-8 w-full">
        {/* Poster Skeleton */}
        <Skeleton className="rounded-xl h-[416px] w-[288px]" />

        {/* Info skeleton */}
        <div className="flex flex-1 flex-col gap-3 text-white max-w-2xl">
          <BlurCircle top="-100px" left="-100px" />

          {/* Sub info row */}
          <div className="flex items-center gap-2 text-sm font-bold">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Title + original title */}
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-12" />
          </div>

          {/* Overview */}
          <Skeleton className="h-20 w-full mt-3" />

          {/* Grid info */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>

          {/* Genres */}
          <Skeleton className="h-4 w-1/2 mt-3" />

          {/* Buttons */}
          <div className="flex items-center gap-4 mt-4">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
