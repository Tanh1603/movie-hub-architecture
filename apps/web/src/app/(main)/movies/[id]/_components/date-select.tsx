'use client';
import { Button } from '@movie-hub/shacdn-ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import { DateSelect7Days } from '@/components/date-select-7days';
import {
  useGetCinemaDetail,
  useGetCinemasWithFilters,
} from '@/hooks/cinema-hooks';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { toast } from 'sonner';
import { BlurCircle } from '../../../../../components/blur-circle';
import { CinemaShowtime } from './cinema-showtime';

export const DateSelect = ({
  movieId,
  cinemaId,
  availableCities,
}: {
  movieId: string;
  cinemaId?: string;
  availableCities: string[];
}) => {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedLocation, setSelectedLocation] = useState<string>(
    availableCities[0] || ''
  );
  const [selectedShowtime, setSelectedShowtime] = useState<string | null>(null);

  const handleSelectShowtime = useCallback((showtimeId: string) => {
    setSelectedShowtime(showtimeId);
  }, []);

  const onBookHandler = useCallback(() => {
    if (!selected) return toast.error('Vui lòng chọn ngày');
    if (!selectedShowtime) return toast.error('Vui lòng chọn suất chiếu');
    router.push(`/showtimes/${selectedShowtime}`);
  }, [router, selected, selectedShowtime]);

  // Nếu có cinemaId => lấy chi tiết rạp
  const { data: cinemaDetail } = useGetCinemaDetail(cinemaId ?? '');
  // Nếu không có cinemaId => lấy danh sách theo city

  const {
    data: cinemasFilter,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useGetCinemasWithFilters({
    city: selectedLocation,
    limit: 10,
  });

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  useEffect(() => {
    if (cinemaDetail?.city) {
      setSelectedLocation(cinemaDetail.city);
    }
  }, [cinemaDetail]);

  const cinemas =
    cinemaId && cinemaDetail
      ? [cinemaDetail]
      : cinemasFilter
      ? cinemasFilter.pages.flatMap((page) => page.cinemas)
      : [];
  return (
    <div id="dateSelect" className="pt-30 relative">
      <div className="flex flex-col items-center justify-between gap-10 relative p-8 bg-slate-200/5 border border-slate-200/10 rounded-lg">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle top="100px" right="0px" />
        {/* Date select */}
        <div className="flex w-full flex-col items-center justify-between gap-10 md:flex-row">
          <DateSelect7Days selected={selected} onSelect={setSelected} />

          <Button
            disabled={!selectedShowtime}
            onClick={onBookHandler}
            className="cursor-pointer px-8 py-2 transition-all bg-primary hover:bg-primary/90 max-sm:mx-auto"
          >
            Đặt ngay
          </Button>
        </div>

        {/* Cinema showtime list */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 w-full">
          <div className="flex items-center justify-between w-full">
            <p className="text-lg font-bold text-white">Danh sách rạp</p>
            <Select
              value={selectedLocation}
              onValueChange={setSelectedLocation}
            >
              <SelectTrigger className=" w-[180px] h-10 bg-transparent text-slate-100 font-semibold text-lg border border-slate-200/20 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-transparent data-[state=open]:ring-2 data-[state=open]:ring-primary transition-all">
                <SelectValue
                  placeholder={
                    <span className="text-slate-100">Chọn khu vực</span>
                  }
                />
              </SelectTrigger>
              <SelectContent
                className="text-slate-100 bg-zinc-900 border-slate-200/20"
                position="popper"
              >
                {availableCities?.map((city) => (
                  <SelectItem
                    key={city}
                    value={city}
                    className="data-[disabled]:text-gray-500 data-[highlighted]:bg-primary/20 "
                  >
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-4 w-full">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <CinemaShowtime.Skeleton key={i} />
            ))
          ) : cinemas.length === 0 ? (
            <p className="text-center text-neutral-400 font-semibold">
              Không có rạp nào
            </p>
          ) : (
            cinemas.map((cinema) => (
              <CinemaShowtime
                key={cinema.id}
                movieId={movieId}
                cinema={cinema}
                selectedDate={selected}
                onSelectShowtime={handleSelectShowtime}
                selectedShowtime={selectedShowtime}
              />
            ))
          )}

          <div ref={ref} className="w-full">
            {isFetchingNextPage && <CinemaShowtime.Skeleton />}
          </div>
        </div>
      </div>
    </div>
  );
};
