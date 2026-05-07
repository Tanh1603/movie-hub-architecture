'use client';

import * as React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@movie-hub/shacdn-ui/carousel';
import { Button } from '@movie-hub/shacdn-ui/button';
import { Play, Info } from 'lucide-react';
import { useGetMovies } from '@/hooks/movie-hooks';
import Link from 'next/link';

// Placeholder gradients if not provided by backend
const gradients = [
  'from-orange-600/80',
  'from-amber-700/80',
  'from-purple-800/80',
  'from-blue-800/80',
  'from-red-800/80',
];

export default function HeroSection() {
  const [api, setApi] = React.useState<CarouselApi>();

  // Fetch 'now_showing' movies for the Hero Section
  const { data, isLoading } = useGetMovies({
    status: 'now_showing',
    limit: 5, // Fetch top 5 for slider
  });

  const movies = data?.pages?.slice(0, 5) ?? [];

  React.useEffect(() => {
    if (!api) {
      return;
    }

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api]);

  return (
    <section className="relative w-screen ml-[calc(50%-50vw)] h-[600px] lg:h-[700px] overflow-hidden bg-black">
      {isLoading ? (
        // Loading Skeleton
        <div className="w-full h-full animate-pulse bg-gray-900 flex items-center justify-center">
          <span className="text-gray-500">Đang tải phim nổi bật...</span>
        </div>
      ) : (
        <Carousel
          setApi={setApi}
          opts={{
            loop: true,
          }}
          className="w-full h-full"
        >
          <CarouselContent className="-ml-0">
            {movies.map((movie, index) => (
              <CarouselItem
                key={movie.id}
                className="relative w-full h-[600px] lg:h-[700px] pl-0"
              >
                {/* Background Image: Prefer backdropUrl, fallback to posterUrl */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                  style={{
                    backgroundImage: `url(${
                      movie.backdropUrl || movie.posterUrl
                    })`,
                  }}
                />

                {/* Gradient Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${
                    gradients[index % gradients.length]
                  } via-gray-900/60 to-transparent`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

                {/* Content */}
                <div className="relative h-full flex items-start lg:items-center max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-24 xl:px-32">
                  <div className="max-w-3xl space-y-4 md:space-y-6 pt-28 sm:pt-32 lg:pt-20">
                    <span className="inline-block px-3 py-1 bg-yellow-400 text-black font-bold text-[10px] sm:text-xs rounded uppercase tracking-wider">
                      Đang Chiếu
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight uppercase drop-shadow-lg">
                      {movie.title}
                    </h1>

                    {/* Description is not in MovieSummary, using a generic tagline or hiding it if unavailable. 
                        Ideally backend provides a short description or tagline. 
                        For now, we can render production info or generic text.*/}
                    <p className="text-base sm:text-lg text-gray-200 line-clamp-2 drop-shadow-md">
                      {/* {movie.description} - unavailable in MovieSummary. Using localized rating/country info instead. */}
                      Phim {movie.productionCountry} | {movie.runtime} phút |{' '}
                      {movie.ageRating}
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                      <Link href={`/movies/${movie.id}`}>
                        <Button className="h-10 sm:h-12 px-6 sm:px-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-full text-base sm:text-lg shadow-[0_0_20px_-5px_hsl(var(--primary))] transition-transform hover:scale-105">
                          <Play className="mr-2 w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                          ĐẶT VÉ NGAY
                        </Button>
                      </Link>

                      <Link href={`/movies/${movie.id}`}>
                        <Button
                          variant="outline"
                          className="h-10 sm:h-12 px-6 sm:px-8 border-white text-white hover:bg-white hover:text-black font-bold rounded-full text-base sm:text-lg transition-all backdrop-blur-sm"
                        >
                          <Info className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                          CHI TIẾT
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {/* Navigation Controls - Hidden on mobile, shown on large screens */}
          <div className="hidden lg:flex absolute bottom-32 right-12 z-20 gap-2">
            <CarouselPrevious className="static translate-y-0 bg-white/10 hover:bg-primary border-none text-white w-12 h-12 rounded-full backdrop-blur-md" />
            <CarouselNext className="static translate-y-0 bg-white/10 hover:bg-primary border-none text-white w-12 h-12 rounded-full backdrop-blur-md" />
          </div>
        </Carousel>
      )}
    </section>
  );
}
