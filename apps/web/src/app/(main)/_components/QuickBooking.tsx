'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import { Button } from '@movie-hub/shacdn-ui/button';
import { Building2, CalendarDays, Clock, Film } from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllCinemas,
  getMovieAtCinemas,
  getMovieShowtimesAtCinema,
} from '@/libs/actions/cinemas/cinema-action';

interface Cinema {
  id: string;
  name: string;
}

interface Movie {
  id: string;
  title: string;
}

interface DateOption {
  value: string;
  label: string;
}

interface ShowtimeOption {
  id: string;
  startTime: string;
  label: string;
}

export default function QuickBooking() {
  const router = useRouter();

  // State management
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [dates, setDates] = useState<DateOption[]>([]);
  const [showtimes, setShowtimes] = useState<ShowtimeOption[]>([]);

  const [selectedCinema, setSelectedCinema] = useState<string>('');
  const [selectedMovie, setSelectedMovie] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedShowtime, setSelectedShowtime] = useState<string>('');

  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [isLoadingShowtimes, setIsLoadingShowtimes] = useState(false);

  // Fetch cinemas on mount
  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const response = await getAllCinemas();
        if (response.data) {
          setCinemas(response.data.map((c) => ({ id: c.id, name: c.name })));
        }
      } catch (error) {
        toast.error('Không thể tải danh sách rạp');
      }
    };
    fetchCinemas();
  }, []);

  // Fetch movies when cinema changes
  useEffect(() => {
    if (!selectedCinema) {
      setMovies([]);
      setSelectedMovie('');
      return;
    }

    const fetchMovies = async () => {
      setIsLoadingMovies(true);
      try {
        const response = await getMovieAtCinemas(selectedCinema, {
          page: 1,
          limit: 100,
        });
        if (response.data) {
          setMovies(response.data.map((m) => ({ id: m.id, title: m.title })));
        }
      } catch (error) {
        toast.error('Không thể tải danh sách phim');
      } finally {
        setIsLoadingMovies(false);
      }
    };

    fetchMovies();
    // Reset dependent selections
    setSelectedMovie('');
    setSelectedDate('');
    setSelectedShowtime('');
    setDates([]);
    setShowtimes([]);
  }, [selectedCinema]);

  // Fetch showtimes when cinema and movie change
  useEffect(() => {
    if (!selectedCinema || !selectedMovie) {
      setDates([]);
      setShowtimes([]);
      setSelectedDate('');
      setSelectedShowtime('');
      return;
    }

    const fetchShowtimes = async () => {
      setIsLoadingShowtimes(true);
      try {
        const response = await getMovieShowtimesAtCinema(
          selectedCinema,
          selectedMovie,
          {} as any // Empty query to get all available dates
        );

        if (response.data && response.data.length > 0) {
          // Process flat list of showtimes
          const processedShowtimes = response.data.map((st: any) => {
            const startDate = new Date(st.startTime);
            const dateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
            return {
              id: st.id,
              startTime: st.startTime,
              date: dateStr,
              label: startDate.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
              }),
            };
          });

          // Extract unique dates
          const uniqueDatesMap = new Map();
          processedShowtimes.forEach((st: any) => {
            if (!uniqueDatesMap.has(st.date)) {
              uniqueDatesMap.set(st.date, {
                value: st.date,
                label: new Date(st.startTime).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  timeZone: 'UTC',
                }),
              });
            }
          });

          const uniqueDates = Array.from(uniqueDatesMap.values()).sort((a, b) =>
            a.value.localeCompare(b.value)
          );

          setDates(uniqueDates);
          setShowtimes(processedShowtimes);
        } else {
          toast.info('Không có suất chiếu khả dụng');
        }
      } catch (error) {
        toast.error('Không thể tải lịch chiếu');
      } finally {
        setIsLoadingShowtimes(false);
      }
    };

    fetchShowtimes();
    setSelectedDate('');
    setSelectedShowtime('');
  }, [selectedCinema, selectedMovie]);

  // Filter showtimes by selected date
  const filteredShowtimes = useMemo(() => {
    if (!selectedDate) return [];
    return showtimes.filter((st) => (st as any).date === selectedDate);
  }, [selectedDate, showtimes]);

  // Handle booking navigation
  const handleBooking = () => {
    if (!selectedCinema || !selectedMovie || !selectedShowtime) {
      toast.warning('Vui lòng chọn đầy đủ thông tin');
      return;
    }

    // Navigate to showtime booking page
    router.push(`/showtimes/${selectedShowtime}`);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto -mt-32 mb-12 z-20 px-4">
      <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden p-6 md:p-8">
        <div className="flex flex-col xl:flex-row items-center gap-6 justify-between">
          {/* Header Section */}
          <div className="flex flex-col items-start gap-1 min-w-[150px]">
            <h2 className="text-2xl font-black text-white uppercase tracking-widest leading-none">
              Đặt Vé
            </h2>
            <span className="text-primary font-semibold tracking-wider text-xs uppercase">
              Nhanh chóng & Tiện lợi
            </span>
          </div>

          {/* Selections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full">
            {/* Cinema Selection */}
            <div className="group relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                <Building2 className="text-gray-400 group-hover:text-primary transition-colors w-5 h-5" />
              </div>
              <Select value={selectedCinema} onValueChange={setSelectedCinema}>
                <SelectTrigger className="w-full h-14 pl-10 pr-4 bg-white/5 border-white/10 text-white placeholder:text-gray-400 hover:bg-white/10 hover:border-primary focus:ring-primary/20 transition-all rounded-xl shadow-sm">
                  <SelectValue placeholder="Chọn Rạp" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-100 text-gray-700 max-h-64 overflow-y-auto">
                  {cinemas.map((cinema) => (
                    <SelectItem key={cinema.id} value={cinema.id}>
                      {cinema.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Movie Selection */}
            <div className="group relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                <Film className="text-gray-400 group-hover:text-primary transition-colors w-5 h-5" />
              </div>
              <Select
                value={selectedMovie}
                onValueChange={setSelectedMovie}
                disabled={!selectedCinema || isLoadingMovies}
              >
                <SelectTrigger className="w-full h-14 pl-10 pr-4 bg-white/5 border-white/10 text-white placeholder:text-gray-400 hover:bg-white/10 hover:border-primary focus:ring-primary/20 transition-all rounded-xl shadow-sm disabled:opacity-50">
                  <SelectValue
                    placeholder={isLoadingMovies ? 'Đang tải...' : 'Chọn Phim'}
                  />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-100 text-gray-700 max-h-64 overflow-y-auto">
                  {movies.map((movie) => (
                    <SelectItem key={movie.id} value={movie.id}>
                      {movie.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div className="group relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                <CalendarDays className="text-gray-400 group-hover:text-primary transition-colors w-5 h-5" />
              </div>
              <Select
                value={selectedDate}
                onValueChange={setSelectedDate}
                disabled={!selectedMovie || isLoadingShowtimes}
              >
                <SelectTrigger className="w-full h-14 pl-10 pr-4 bg-white/5 border-white/10 text-white placeholder:text-gray-400 hover:bg-white/10 hover:border-primary focus:ring-primary/20 transition-all rounded-xl shadow-sm disabled:opacity-50">
                  <SelectValue
                    placeholder={
                      isLoadingShowtimes ? 'Đang tải...' : 'Chọn Ngày'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-100 text-gray-700">
                  {dates.map((date) => (
                    <SelectItem key={date.value} value={date.value}>
                      {date.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Showtime Selection */}
            <div className="group relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                <Clock className="text-gray-400 group-hover:text-primary transition-colors w-5 h-5" />
              </div>
              <Select
                value={selectedShowtime}
                onValueChange={setSelectedShowtime}
                disabled={!selectedDate}
              >
                <SelectTrigger className="w-full h-14 pl-10 pr-4 bg-white/5 border-white/10 text-white placeholder:text-gray-400 hover:bg-white/10 hover:border-primary focus:ring-primary/20 transition-all rounded-xl shadow-sm disabled:opacity-50">
                  <SelectValue placeholder="Chọn Suất" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-100 text-gray-700">
                  {filteredShowtimes.map((showtime) => (
                    <SelectItem key={showtime.id} value={showtime.id}>
                      {showtime.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Booking Button */}
          <Button
            onClick={handleBooking}
            disabled={!selectedCinema || !selectedMovie || !selectedShowtime}
            className="h-14 w-full xl:w-auto px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            ĐẶT VÉ NGAY
          </Button>
        </div>
      </div>
    </div>
  );
}
