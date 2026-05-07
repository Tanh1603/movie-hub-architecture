// src/app/(admin)/showtimes/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, Trash2, Pencil } from 'lucide-react';
import { Button } from '@movie-hub/shacdn-ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@movie-hub/shacdn-ui/card';
import { Label } from '@movie-hub/shacdn-ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import { Calendar } from '@movie-hub/shacdn-ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@movie-hub/shacdn-ui/popover';
import { useShowtimes, useDeleteShowtime, useMovies, useCinemas, useHallsGroupedByCinema } from '@/libs/api';
import type { Showtime, Hall } from '@/libs/api/types';
import { format } from 'date-fns';
import ShowtimeDialog from '../_components/forms/ShowtimeDialog';

export default function ShowtimesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date()); // Set to today by default
  const [selectedCinemaId, setSelectedCinemaId] = useState('all');
  const [selectedMovieId, setSelectedMovieId] = useState('all');

  // API hooks: pass date (now defaults to today)
  // TIMEZONE FIX: Don't use toISOString() as it converts to UTC and shifts the date
  // Instead, format date in local timezone to YYYY-MM-DD
  const formatDateForQuery = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const { data: showtimesData = [], isLoading: loading, refetch: refetchShowtimes } = useShowtimes({
    cinemaId: selectedCinemaId !== 'all' ? selectedCinemaId : undefined,
    movieId: selectedMovieId !== 'all' ? selectedMovieId : undefined,
    date: formatDateForQuery(selectedDate),
  });
  const showtimes = showtimesData || [];
  const { data: moviesData = [] } = useMovies();
  const movies = moviesData || [];
  const moviesAdmin = movies;
  const { data: cinemasData = [] } = useCinemas();
  const cinemas = cinemasData || [];
  const cinemasAdmin = cinemas;
  const deleteShowtime = useDeleteShowtime();

  // Halls: derive a flat halls list from grouped halls by cinema
  const { data: hallsByCinema = {} } = useHallsGroupedByCinema();
  const halls: Hall[] = Object.values(hallsByCinema).flatMap((g: { cinema: unknown; halls: unknown[] }) => (g.halls || []) as Hall[]);

  useEffect(() => {
    // Trigger re-fetch when filters change (handled by React Query)
  }, [selectedDate, selectedCinemaId, selectedMovieId]);

  const handleEdit = (showtime: Showtime) => {
    // Showtime object should have movieId and movieReleaseId from API
    // If it doesn't, try to find from the loaded data
    const enrichedShowtime = {
      ...showtime,
      movieId: showtime.movieId || '',
      movieReleaseId: showtime.movieReleaseId || '',
    };
    setEditingShowtime(enrichedShowtime);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteShowtime.mutateAsync(id);
    } catch {
      // Error toast already shown by mutation hook
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'SELLING':
        return 'bg-green-100 text-green-700';
      case 'STOPPED':
        return 'bg-orange-100 text-orange-700';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const groupedShowtimes = showtimes.reduce((acc, showtime) => {
    const movieId = showtime.movieId;
    if (!acc[movieId]) {
      acc[movieId] = [];
    }
    acc[movieId].push(showtime as unknown as Showtime);
    return acc;
  }, {} as Record<string, Showtime[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suất Chiếu</h1>
          <p className="text-gray-500 mt-1">Quản lý suất chiếu và lịch chiếu</p>
        </div>
        <Button
          onClick={() => {
            setEditingShowtime(null);
            setDialogOpen(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm Suất Chiếu
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Modern Filter Container with Gradient */}
          <div className="p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 rounded-lg border border-purple-200/50 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">📅 Ngày</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="w-full justify-between h-11 bg-white border border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-left text-black font-medium transition-colors">
                      {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Chọn Ngày'}
                      <CalendarIcon className="h-4 w-4 text-purple-600" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="[&_[role=button]]:text-black [&_[role=button]]:font-semibold"
                    />
                    <div className="border-t p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(new Date())}
                        className="w-full"
                      >
                        Đặt Lại Hôm Nay
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Cinema Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">🏢 Rạp Chiếu</label>
                <Select value={selectedCinemaId} onValueChange={setSelectedCinemaId}>
                  <SelectTrigger className="h-11 bg-white border border-purple-200 hover:border-purple-300 focus:border-purple-400 font-medium">
                    <SelectValue placeholder="Tất Cả Rạp Chiếu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất Cả Rạp Chiếu</SelectItem>
                    {cinemas.map((cinema) => (
                      <SelectItem key={cinema.id} value={cinema.id}>
                        {cinema.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Movie Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">🎬 Phim</label>
                <Select value={selectedMovieId} onValueChange={setSelectedMovieId}>
                  <SelectTrigger className="h-11 bg-white border border-purple-200 hover:border-purple-300 focus:border-purple-400 font-medium">
                    <SelectValue placeholder="Tất Cả Phim" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất Cả Phim</SelectItem>
                    {movies.map((movie) => (
                      <SelectItem key={movie.id} value={movie.id}>
                        {movie.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedCinemaId !== 'all' || selectedMovieId !== 'all') && (
              <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-purple-200/50">
                {selectedCinemaId !== 'all' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                    <span className="text-xs text-gray-600">Rạp: <span className="font-semibold text-purple-700">{cinemas.find(c => c.id === selectedCinemaId)?.name || selectedCinemaId}</span></span>
                    <button onClick={() => setSelectedCinemaId('all')} className="text-purple-400 hover:text-purple-600">✕</button>
                  </div>
                )}
                {selectedMovieId !== 'all' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                    <span className="text-xs text-gray-600">Phim: <span className="font-semibold text-purple-700">{movies.find(m => m.id === selectedMovieId)?.title || selectedMovieId}</span></span>
                    <button onClick={() => setSelectedMovieId('all')} className="text-purple-400 hover:text-purple-600">✕</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm font-medium text-gray-700">
              <span className="text-purple-600 font-bold">{showtimes.length}</span> suất chiếu được lên lịch
            </div>
            {(selectedCinemaId !== 'all' || selectedMovieId !== 'all') && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedCinemaId('all');
                  setSelectedMovieId('all');
                  setSelectedDate(new Date());
                }}
                className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
              >
                ✕ Xóa Tất Cả Bộ Lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">Đang tải...</CardContent>
          </Card>
        ) : Object.keys(groupedShowtimes).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              Không có suất chiếu nào được lên lịch cho ngày này
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedShowtimes).map(([movieId, movieShowtimes]) => {
            // Try to get movieTitle from showtime response (BE provides this if movie-service call succeeds)
            let movieTitle = movieShowtimes[0]?.movieTitle;
            
            // Fallback: if movieTitle not in showtime response, look up from movies array
            if (!movieTitle) {
              const movie = moviesAdmin.find((m) => m.id === movieId);
              movieTitle = movie?.title;
            }
            
            // Final fallback if movie not found in either place
            if (!movieTitle) {
              movieTitle = `Phim Không Xác Định (${movieId})`;
            }
            
            const movie = moviesAdmin.find((m) => m.id === movieId);
            
            // Log if title had to fallback (helps identify if BE is returning movieTitle)
            if (!movieShowtimes[0]?.movieTitle && movie?.title) {
              console.log('[ShowtimesPage] Using movie title from movies API (BE movieTitle was null)', {
                movieId,
                movieTitle: movie.title,
              });
            }
            
            return (
              <Card key={movieId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{movieTitle}</span>
                    <Badge variant="secondary">
                      {movieShowtimes.length} phiên chiếu
                    </Badge>
                  </CardTitle>
                  {movie && (
                    <CardDescription>
                      {movie.runtime && `${movie.runtime} phút`}
                      {movie.ageRating && movie.runtime && ' · '}
                      {movie.ageRating}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {movieShowtimes.map((showtime) => {
                      const cinema = cinemas.find((c) => c.id === showtime.cinemaId);
                      // TIMEZONE WORKAROUND: BE adds +7h in mapper, we need to subtract it
                      const correctedStartTime = new Date(new Date(showtime.startTime).getTime() - 7 * 60 * 60 * 1000);
                      return (
                        <Card key={showtime.id} className="relative">
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-semibold text-lg">
                                    {format(correctedStartTime, 'HH:mm')}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {cinema?.name}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(showtime)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(showtime.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                {format(correctedStartTime, 'HH:mm')} -{' '}
                                {movie?.runtime ? (() => {
                                  const endDate = new Date(correctedStartTime.getTime() + movie.runtime * 60 * 1000);
                                  return format(endDate, 'HH:mm');
                                })() : 'N/A'}
                              </div>

                              <div className="flex items-center justify-between">
                                <Badge className={getStatusColor(showtime.status)}>
                                  {showtime.status}
                                </Badge>
                              </div>

                              {showtime.availableSeats !== undefined && (
                                <div className="text-sm text-gray-500">
                                  {showtime.availableSeats} ghế còn trống
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{showtime.format}</Badge>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  🎬 {{
                                    vi: 'Tiếng Việt',
                                    en: 'English',
                                    ko: 'Korean',
                                    zh: 'Chinese',
                                    ja: 'Japanese',
                                    th: 'Thai'
                                  }[showtime.language] || showtime.language}
                                </Badge>
                                {showtime.subtitles && showtime.subtitles.length > 0 && (
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    📝 {showtime.subtitles.map(s => ({
                                      vi: 'Phụ đề Việt',
                                      en: 'Phụ đề Anh',
                                      ko: 'Phụ đề Hàn',
                                      zh: 'Phụ đề Trung',
                                      ja: 'Phụ đề Nhật',
                                      th: 'Phụ đề Thái'
                                    }[s] || s)).join(', ')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Showtime Dialog */}
      <ShowtimeDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingShowtime(null);
          }
        }}
        movies={moviesAdmin}
        cinemas={cinemasAdmin}
        halls={halls}
        editingShowtime={editingShowtime}
        onSuccess={() => {
          refetchShowtimes();
        }}
      />
    </div>
  );
}
