'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGetCinemasNearby } from '@/hooks/cinema-hooks';
import { useRouter } from 'next/navigation';
import { CinemaLocationCard } from './cinema-loaction-card';
import { ErrorFallback } from '@/components/error-fallback';
import { BlurCircle } from '@/components/blur-circle';
import type { CinemaLocationResponse } from '@/libs/types/cinema.type';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@movie-hub/shacdn-ui/carousel';
import { Button } from '@movie-hub/shacdn-ui/button';

export const CinemaListNearby = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setError('');
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Bạn đã từ chối chia sẻ vị trí.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Không thể xác định vị trí hiện tại.');
            break;
          case err.TIMEOUT:
            setError('Yêu cầu định vị mất quá nhiều thời gian.');
            break;
          default:
            setError('Lỗi không xác định khi lấy vị trí.');
        }
      }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const {
    data,
    isLoading,
    error: fetchError,
    isError,
  } = useGetCinemasNearby(location?.lat ?? 0, location?.lng ?? 0, 10, 10);
  const router = useRouter();
  const goToCinemaDetail = useCallback(
    (cinemaId: string) => router.push(`/cinemas/${cinemaId}`),
    [router]
  );

  const cinemas = data?.cinemas || [];

  if (!location) {
    return (
      <div className="px-6 py-10 text-center flex flex-col gap-4 text-gray-300">
        <p className="text-base">
          🎯 Bật định vị để xem rạp chiếu phim gần bạn nhất!
        </p>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button
          onClick={requestLocation}
          className="w-fit mx-auto rounded-xl px-6 py-2"
        >
          Cấp quyền vị trí
        </Button>
      </div>
    );
  }

  return (
    <div className="px-6">
      <div className="relative flex items-center justify-between pt-20 pb-10">
        <BlurCircle top="0" right="-80px" />
        {/* <p className="text-gray-300 font-bold text-lg"> 🎯RẠP GẦN BẠN</p> */}
      </div>

      <Carousel className="w-full">
        <CarouselContent className="m-0">
          {isError ? (
            <ErrorFallback message={fetchError.message} />
          ) : isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                <CinemaLocationCard.Skeleton />
              </CarouselItem>
            ))
          ) : cinemas.length === 0 ? (
            <div className="text-center py-10 text-gray-500 flex items-center justify-center w-full">
              🎦Không có rạp nào gần cả.
            </div>
          ) : (
            cinemas.map((cinema: CinemaLocationResponse) => (
              <CarouselItem
                key={cinema.id}
                className="md:basis-1/2 lg:basis-1/3"
              >
                <CinemaLocationCard
                  cinema={cinema}
                  onSelect={goToCinemaDetail}
                />
              </CarouselItem>
            ))
          )}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};
