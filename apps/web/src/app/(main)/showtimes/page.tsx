'use client';

import { DateSelect7Days } from '@/components/date-select-7days';
import { useGetAllMoviesWithShowtimes } from '@/hooks/cinema-hooks';
import { Loader } from '@/components/loader';
import { useState } from 'react';
import { MovieShowtimeCard } from './_components/movie-showtime-card';
import { Calendar, Film } from 'lucide-react';

export default function ShowtimesPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const {
    data: movies,
    isLoading,
    isError,
  } = useGetAllMoviesWithShowtimes({
    date: selectedDate,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pb-20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Enhanced Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 mb-6">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">
              Lịch Chiếu Phim
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
            <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              LỊCH CHIẾU
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              PHIM HAY
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Khám phá các suất chiếu phim mới nhất tại rạp phim gần bạn
          </p>
        </div>

        {/* Date Selector */}
        <div className="max-w-4xl mx-auto mb-14">
          <DateSelect7Days selected={selectedDate} onSelect={setSelectedDate} />
        </div>

        {/* Content Section */}
        <div className="relative">
          {/* Section divider */}
          <div className="flex items-center gap-4 mb-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/50 border border-white/10">
              <Film className="w-5 h-5 text-purple-400" />
              <span className="text-white font-semibold">
                {movies?.length || 0} phim đang chiếu
              </span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 via-white/10 to-transparent" />
          </div>

          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-4">
              <Loader size={48} />
              <p className="text-slate-400 animate-pulse">
                Đang tải lịch chiếu...
              </p>
            </div>
          ) : isError ? (
            <div className="max-w-md mx-auto text-center py-16 px-8 bg-red-500/10 rounded-2xl border border-red-500/20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <p className="text-red-400 font-medium text-lg">
                Có lỗi xảy ra khi tải lịch chiếu
              </p>
              <p className="text-slate-500 mt-2">Vui lòng thử lại sau</p>
            </div>
          ) : !movies || movies.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-20 px-8 bg-slate-800/30 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
                <Calendar className="w-10 h-10 text-purple-400" />
              </div>
              <p className="text-xl font-semibold text-white mb-2">
                Chưa có lịch chiếu
              </p>
              <p className="text-slate-400">
                Không có suất chiếu nào cho ngày{' '}
                <span className="text-purple-400 font-medium">
                  {new Date(selectedDate).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-6 max-w-5xl mx-auto">
              {movies.map((movie, index) => (
                <div
                  key={movie.id}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <MovieShowtimeCard movie={movie} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
