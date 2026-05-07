'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@movie-hub/shacdn-ui/dialog';
import { Label } from '@movie-hub/shacdn-ui/label';
import { Input } from '@movie-hub/shacdn-ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import { Button } from '@movie-hub/shacdn-ui/button';
import { useToast } from '../../_libs/use-toast';
import { useCreateShowtime, useUpdateShowtime, useShowtime, useMovieReleases } from '@/libs/api';
import type { Showtime, Movie, Cinema, Hall, CreateShowtimeRequest } from '@/libs/api/types';
import { FormatEnum } from '@movie-hub/shared-types/cinema/enum';

interface ShowtimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movies: Movie[];
  cinemas: Cinema[];
  halls: Hall[];
  editingShowtime?: Showtime | null;
  preSelectedMovieId?: string;
  preSelectedReleaseId?: string;
  onSuccess?: () => void;
}

export default function ShowtimeDialog({
  open,
  onOpenChange,
  movies,
  cinemas,
  halls,
  editingShowtime,
  preSelectedMovieId,
  preSelectedReleaseId,
  onSuccess,
}: ShowtimeDialogProps) {
  const createShowtime = useCreateShowtime();
  const updateShowtime = useUpdateShowtime();
  // Fetch full showtime detail from API when editing (if showtime ID provided)
  const { data: fetchedShowtimeDetail } = useShowtime(editingShowtime?.id || null);
  // Use fetched detail if available, otherwise fall back to editingShowtime from props
  const fullShowtimeDetail = fetchedShowtimeDetail || editingShowtime;
  const [formData, setFormData] = useState<CreateShowtimeRequest>({
    movieId: '',
    movieReleaseId: '',
    cinemaId: '',
    hallId: '',
    startTime: '',
    format: FormatEnum.TWO_D,
    language: 'vi',
    subtitles: [],
  });
  // Fetch releases for the selected movie (or pre-selected movie)
  // Triggers whenever movieId in form changes OR when editingShowtime's movieId is loaded
  const { data: movieReleasesData = [] } = useMovieReleases(
    (formData?.movieId || preSelectedMovieId) ? { movieId: formData?.movieId || preSelectedMovieId } : undefined
  );
  const movieReleases = useMemo(() => movieReleasesData || [], [movieReleasesData]);
  const { toast } = useToast();

  // Debug: log when releases are fetched
  useEffect(() => {
    if (formData?.movieId && movieReleases.length > 0) {
      console.log('[ShowtimeDialog] Loaded releases for movie:', {
        movieId: formData.movieId,
        releaseCount: movieReleases.length,
        releases: movieReleases.map(r => ({ id: r.id, startDate: r.startDate, status: r.status })),
      });
    } else if (formData?.movieId && movieReleases.length === 0) {
      console.warn('[ShowtimeDialog] No releases found for movie:', formData.movieId);
    }
  }, [formData?.movieId, movieReleases]);

  // Auto-select movieReleaseId if editingShowtime has it but form doesn't yet
  useEffect(() => {
    if (editingShowtime?.movieReleaseId && !formData.movieReleaseId && movieReleases.length > 0) {
      console.log('[ShowtimeDialog] Auto-selecting movieReleaseId from editingShowtime:', {
        movieReleaseId: editingShowtime.movieReleaseId,
      });
      // Check if the movieReleaseId exists in the releases list
      const releaseExists = movieReleases.some(r => r.id === editingShowtime.movieReleaseId);
      if (releaseExists) {
        setFormData(prev => ({
          ...prev,
          movieReleaseId: editingShowtime.movieReleaseId || '',
        }));
      } else {
        console.warn('[ShowtimeDialog] movieReleaseId not found in releases list:', editingShowtime.movieReleaseId);
      }
    }
  }, [editingShowtime?.movieReleaseId, movieReleases, formData.movieReleaseId]);

  useEffect(() => {
    // Use fullShowtimeDetail if available (has complete data from API)
    const showtimeToUse = fullShowtimeDetail || editingShowtime;
    
    if (showtimeToUse) {
      // CRITICAL TIMEZONE WORKAROUND:
      // BE has a complex timezone bug:
      // 1. When creating, BE uses new Date(string) which parses wrong
      // 2. BE adds +7 hours when returning data (see showtime.mapper.ts line 13, 37)
      // 3. This causes double timezone conversion issues
      // Solution: We need to subtract 7 hours when loading for edit
      
      let formattedStartTime = '';
      try {
        const dateFromAPI = new Date(showtimeToUse.startTime);
        // Subtract 7 hours to compensate for BE's +7 hour addition
        const correctedDate = new Date(dateFromAPI.getTime() - 7 * 60 * 60 * 1000);
        
        // Format as datetime-local: YYYY-MM-DDTHH:mm
        const year = correctedDate.getFullYear();
        const month = String(correctedDate.getMonth() + 1).padStart(2, '0');
        const day = String(correctedDate.getDate()).padStart(2, '0');
        const hours = String(correctedDate.getHours()).padStart(2, '0');
        const minutes = String(correctedDate.getMinutes()).padStart(2, '0');
        formattedStartTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        console.log('[ShowtimeDialog] Timezone correction applied:', {
          rawFromAPI: showtimeToUse.startTime,
          dateFromAPI: dateFromAPI.toISOString(),
          correctedDate: correctedDate.toISOString(),
          formatted: formattedStartTime,
          note: 'Subtracted 7 hours to compensate for BE +7 offset',
        });
      } catch (e) {
        console.warn('[ShowtimeDialog] Failed to parse startTime:', showtimeToUse.startTime, e);
        formattedStartTime = '';
      }

      console.log('[ShowtimeDialog] Setting formData from editingShowtime:', {
        movieId: showtimeToUse.movieId,
        movieReleaseId: showtimeToUse.movieReleaseId,
      });

      setFormData({
        movieId: showtimeToUse.movieId,
        movieReleaseId: showtimeToUse.movieReleaseId || '',
        cinemaId: showtimeToUse.cinemaId,
        hallId: showtimeToUse.hallId,
        startTime: formattedStartTime,
        format: showtimeToUse.format,
        language: showtimeToUse.language,
        subtitles: showtimeToUse.subtitles || [],
      });
      console.log('[ShowtimeDialog] Loaded showtime for edit:', {
        id: showtimeToUse.id,
        movieId: showtimeToUse.movieId,
        movieReleaseId: showtimeToUse.movieReleaseId,
        startTime: formattedStartTime,
        raw: showtimeToUse.startTime,
      });
    } else if (preSelectedMovieId && preSelectedReleaseId) {
      // Pre-fill when opening from Movie Releases page
      setFormData({
        movieId: preSelectedMovieId,
        movieReleaseId: preSelectedReleaseId,
        cinemaId: '',
        hallId: '',
        startTime: '',
        format: FormatEnum.TWO_D,
        language: 'vi',
        subtitles: [],
      });
    } else {
      setFormData({
        movieId: '',
        movieReleaseId: '',
        cinemaId: '',
        hallId: '',
        startTime: '',
        format: FormatEnum.TWO_D,
        language: 'vi',
        subtitles: [],
      });
    }
  }, [fullShowtimeDetail, editingShowtime, preSelectedMovieId, preSelectedReleaseId, open]);

  const handleSubmit = async () => {
    if (!formData.movieId || !formData.movieReleaseId || !formData.cinemaId || 
        !formData.hallId || !formData.startTime) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      // WORKAROUND: BE has timezone bug - it uses new Date(string) without timezone handling
      // We need to send the datetime adjusted for timezone offset
      // Input from datetime-local: "2026-01-02T19:30" (user's local time)
      // BE expects: "yyyy-MM-dd HH:mm:ss" but treats it as local browser time
      // Solution: Send UTC time in the expected format so BE's new Date() parses correctly
      
      const localDateTime = new Date(formData.startTime); // Parse as local
      
      // Format as "yyyy-MM-dd HH:mm:ss" using the localDateTime
      // This preserves the user's intended time
      const year = localDateTime.getFullYear();
      const month = String(localDateTime.getMonth() + 1).padStart(2, '0');
      const day = String(localDateTime.getDate()).padStart(2, '0');
      const hours = String(localDateTime.getHours()).padStart(2, '0');
      const minutes = String(localDateTime.getMinutes()).padStart(2, '0');
      
      const startTimeFormatted = `${year}-${month}-${day} ${hours}:${minutes}:00`;
      
      console.log('[ShowtimeDialog] Timezone workaround:', {
        userInput: formData.startTime,
        localDateTime: localDateTime.toISOString(),
        formatted: startTimeFormatted,
        note: 'Sending local time in yyyy-MM-dd HH:mm:ss format',
      });

      const payload = {
        ...formData,
        startTime: startTimeFormatted,
      };

      if (editingShowtime) {
        await updateShowtime.mutateAsync({ id: editingShowtime.id, data: payload });
      } else {
        await createShowtime.mutateAsync(payload);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Error toast already shown by mutation hooks
    }
  };

  const selectedMovie = movies.find(m => m.id === formData.movieId);
  const selectedRelease = movieReleases.find(r => r.id === formData.movieReleaseId);
  const isMovieDisabled = !!preSelectedMovieId;
  const isReleaseDisabled = !!preSelectedReleaseId;

  // Debug logging
  useEffect(() => {
    if (editingShowtime && !selectedMovie) {
      console.warn('[ShowtimeDialog] Movie not found in passed movies array', {
        formDataMovieId: formData.movieId,
        editingShowtimeMovieId: editingShowtime.movieId,
        availableMovies: movies.map(m => ({ id: m.id, title: m.title })),
      });
    }
  }, [editingShowtime, selectedMovie, formData.movieId, movies]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingShowtime ? 'Chỉnh sửa suất chiếu' : 'Thêm suất chiếu mới'}</DialogTitle>
          <DialogDescription>
            {editingShowtime ? 'Cập nhật chi tiết suất chiếu' : 'Lịch chiếu phim mới'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Movie */}
          <div className="space-y-2">
            <Label htmlFor="movie">Phim *</Label>
            {isMovieDisabled ? (
              <Input
                id="movie"
                value={selectedMovie ? `${selectedMovie.title} (${selectedMovie.runtime} phút)` : (formData.movieId || 'Chưa chọn phim')}
                disabled
                className="bg-gray-50"
              />
            ) : (
              <Select
                value={formData.movieId}
                onValueChange={(value) => {
                  setFormData({ 
                    ...formData, 
                    movieId: value,
                    movieReleaseId: '', // Reset release when movie changes
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phim">
                    {selectedMovie ? `${selectedMovie.title} (${selectedMovie.runtime} phút)` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {movies.map((movie) => (
                    <SelectItem key={movie.id} value={movie.id}>
                      {movie.title} ({movie.runtime} phút)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Movie Release ID */}
          <div className="space-y-2">
            <Label htmlFor="movieReleaseId">ID Phát hành phim *</Label>
            {isReleaseDisabled ? (
              <Input
                id="movieReleaseId"
                value={selectedRelease ? `${new Date(selectedRelease.startDate).toLocaleDateString()} → ${new Date(selectedRelease.endDate).toLocaleDateString()}` : ''}
                disabled
                className="bg-gray-50"
              />
            ) : (
              <Select
                value={formData.movieReleaseId}
                onValueChange={(value) =>
                  setFormData({ ...formData, movieReleaseId: value })
                }
                disabled={!formData.movieId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phát hành phim">
                    {selectedRelease ? `${new Date(selectedRelease.startDate).toLocaleDateString()} → ${new Date(selectedRelease.endDate).toLocaleDateString()}` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {formData.movieId && (() => {
                    // movieReleases already contains only releases for formData.movieId
                    // (fetched via useMovieReleases with { movieId: formData.movieId })
                    // No need to filter - just use the data directly
                    const releases = movieReleases;
                    console.log('[ShowtimeDialog] Releases for movieId:', {
                      movieId: formData.movieId,
                      availableReleases: releases.length,
                      releases: releases.map(r => ({ id: r.id, status: r.status })),
                    });
                    if (releases.length === 0) {
                      return <div className="px-2 py-1.5 text-sm text-gray-500">Không có phát hành nào</div>;
                    }
                    return releases.map((release) => (
                      <SelectItem key={release.id} value={release.id}>
                        {new Date(release.startDate).toLocaleDateString()} → {new Date(release.endDate).toLocaleDateString()} ({release.status})
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Cinema */}
          <div className="space-y-2">
            <Label htmlFor="cinema">Rạp Chiếu Phim *</Label>
            <Select
              value={formData.cinemaId}
              onValueChange={(value) => {
                setFormData({ ...formData, cinemaId: value, hallId: '' });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn rạp" />
              </SelectTrigger>
              <SelectContent>
                {cinemas.map((cinema) => (
                  <SelectItem key={cinema.id} value={cinema.id}>
                    {cinema.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hall */}
          <div className="space-y-2">
            <Label htmlFor="hall">Phòng Chiếu *</Label>
            {!formData.cinemaId ? (
              <div className="px-3 py-2 border rounded-md bg-gray-50 text-gray-500 text-sm">
                Chọn rạp trước
              </div>
            ) : (
              <Select
                value={formData.hallId}
                onValueChange={(value) =>
                  setFormData({ ...formData, hallId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phòng" />
                </SelectTrigger>
                <SelectContent>
                  {halls && halls.length > 0 ? (
                    halls
                      .filter(hall => hall.cinemaId === formData.cinemaId)
                      .map((hall) => (
                        <SelectItem key={hall.id} value={hall.id}>
                          {hall.name} ({hall.type}) - {hall.capacity} ghế
                        </SelectItem>
                      ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">
                      Không có phòng nào
                    </div>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="startTime">Thời Gian Bắt Đầu *</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => {
                setFormData({ 
                  ...formData, 
                  startTime: e.target.value,
                });
              }}
            />
          </div>

          {/* Format & Language */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Định dạng</Label>
              <Select
                value={formData.format}
                onValueChange={(value) =>
                  setFormData({ ...formData, format: value as FormatEnum })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn định dạng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FormatEnum.TWO_D}>2D</SelectItem>
                  <SelectItem value={FormatEnum.THREE_D}>3D</SelectItem>
                  <SelectItem value={FormatEnum.IMAX}>IMAX</SelectItem>
                  <SelectItem value={FormatEnum.FOUR_DX}>4DX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Ngôn ngữ</Label>
              <Select
                value={formData.language}
                onValueChange={(value) =>
                  setFormData({ ...formData, language: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngôn ngữ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="en">Tiếng Anh</SelectItem>
                  <SelectItem value="ko">Tiếng Hàn</SelectItem>
                  <SelectItem value="zh">Tiếng Trung</SelectItem>
                  <SelectItem value="ja">Tiếng Nhật</SelectItem>
                  <SelectItem value="th">Tiếng Thái</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subtitles */}
          <div className="space-y-2">
            <Label htmlFor="subtitles">Subtitles (Phụ đề)</Label>
            <Input
              id="subtitles"
              value={(formData.subtitles || []).join(', ')}
              onChange={(e) => {
                const subtitlesArray = e.target.value
                  .split(',')
                  .map(s => s.trim())
                  .filter(s => s.length > 0);
                setFormData({ ...formData, subtitles: subtitlesArray });
              }}
              placeholder="en"
            />
            <p className="text-xs text-gray-500">
              Nhập các ngôn ngữ phụ đề, phân cách bằng dấu phẩy. Ví dụ: Vietnamese, English, Chinese
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Hủy Bỏ
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {editingShowtime ? 'Cập Nhật Suất Chiếu' : 'Tạo Suất Chiếu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
