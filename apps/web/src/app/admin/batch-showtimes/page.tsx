'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  Film,
  Building2,
  Zap,
  History,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@movie-hub/shacdn-ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@movie-hub/shacdn-ui/card';
import { Label } from '@movie-hub/shacdn-ui/label';
import { Input } from '@movie-hub/shacdn-ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import { Checkbox } from '@movie-hub/shacdn-ui/checkbox';
import { useToast } from '../_libs/use-toast';
import type {
  BatchCreateShowtimesRequest as ApiBatchCreateRequest,
  Showtime as ApiShowtime,
  Hall as ApiHall,
  ShowtimeFormat as ApiShowtimeFormat,
} from '@/libs/api/types';

// Frontend-specific types for batch showtimes form
interface BatchCreateShowtimesInput {
  movieId: string;
  movieReleaseId: string;
  cinemaId: string;
  hallId: string;
  startDate: string;
  endDate: string;
  timeSlots: string[];
  repeatType: 'DAILY' | 'WEEKLY' | 'CUSTOM_WEEKDAYS';
  weekdays?: number[];
  format: string;
  language: string;
  subtitles: string[];
}

interface BatchCreateResponse {
  createdCount: number;
  skippedCount: number;
  created: Array<{
    id: string;
    startTime: string;
  }>;
  skipped: Array<{
    start: string;
    reason: string;
  }>;
}
import {
  useMovies,
  useCinemas,
  useHallsGroupedByCinema,
  useMovieReleases,
  useBatchCreateShowtimes,
} from '@/libs/api';

const WEEKDAYS = [
  { value: 1, label: 'Thứ Hai' },
  { value: 2, label: 'Thứ Ba' },
  { value: 3, label: 'Thứ Tư' },
  { value: 4, label: 'Thứ Năm' },
  { value: 5, label: 'Thứ Sáu' },
  { value: 6, label: 'Thứ Bảy' },
  { value: 0, label: 'Chủ Nhật' },
];

const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
];

const FORMAT_LABELS: Record<string, string> = {
  TWO_D: '2D',
  THREE_D: '3D',
  IMAX: 'IMAX',
  FOUR_DX: '4DX',
};

function BatchShowtimesContent() {
  const searchParams = useSearchParams();
  const preSelectedMovieId = searchParams.get('movieId');
  const preSelectedReleaseId = searchParams.get('releaseId');

  // API hooks
  const { data: moviesData = [] } = useMovies();
  const movies = moviesData || [];
  const { data: cinemasData = [] } = useCinemas();
  const cinemas = cinemasData || [];
  const { data: hallsByCinema = {} } = useHallsGroupedByCinema();
  const halls: ApiHall[] = Object.values(hallsByCinema).flatMap(
    (g: { halls?: ApiHall[] }) => g.halls || []
  );
  const { data: movieReleasesData = [] } = useMovieReleases();
  const movieReleases = movieReleasesData || [];
  const batchCreateMutation = useBatchCreateShowtimes();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchCreateResponse | null>(null);
  const [history, setHistory] = useState<
    Array<{
      id: string;
      timestamp: string;
      movie: string;
      cinema: string;
      hall: string;
      period: string;
      result: BatchCreateResponse;
    }>
  >([]);

  const [formData, setFormData] = useState<BatchCreateShowtimesInput>({
    movieId: '',
    movieReleaseId: '',
    cinemaId: '',
    hallId: '',
    startDate: '',
    endDate: '',
    timeSlots: [],
    repeatType: 'DAILY',
    weekdays: [],
    format: 'TWO_D',
    language: 'vi',
    subtitles: [],
  });

  const { toast } = useToast();

  useEffect(() => {
    if (preSelectedMovieId && preSelectedReleaseId) {
      setFormData((prev) => ({
        ...prev,
        movieId: preSelectedMovieId,
        movieReleaseId: preSelectedReleaseId,
      }));
    }
  }, [preSelectedMovieId, preSelectedReleaseId]);

  const handleMovieChange = (movieId: string) => {
    setFormData({ ...formData, movieId, movieReleaseId: '' });
  };

  const handleTimeSlotToggle = (time: string) => {
    const updated = formData.timeSlots.includes(time)
      ? formData.timeSlots.filter((t) => t !== time)
      : [...formData.timeSlots, time];
    setFormData({ ...formData, timeSlots: updated.sort() });
  };

  const handleWeekdayToggle = (day: number) => {
    const updated = formData.weekdays?.includes(day)
      ? formData.weekdays.filter((d) => d !== day)
      : [...(formData.weekdays || []), day];
    setFormData({ ...formData, weekdays: updated.sort() });
  };

  const handleSubmit = async () => {
    if (
      !formData.movieId ||
      !formData.movieReleaseId ||
      !formData.cinemaId ||
      !formData.hallId ||
      !formData.startDate ||
      !formData.endDate ||
      formData.timeSlots.length === 0
    ) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền tất cả các trường bắt buộc',
        variant: 'destructive',
      });
      return;
    }

    if (
      formData.repeatType === 'CUSTOM_WEEKDAYS' &&
      (!formData.weekdays || formData.weekdays.length === 0)
    ) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn ít nhất một ngày trong tuần',
        variant: 'destructive',
      });
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.startDate)) {
      toast({
        title: 'Lỗi Xác Thực',
        description: 'Ngày bắt đầu phải ở định dạng YYYY-MM-DD',
        variant: 'destructive',
      });
      return;
    }

    if (!dateRegex.test(formData.endDate)) {
      toast({
        title: 'Lỗi Xác Thực',
        description: 'Ngày kết thúc phải ở định dạng YYYY-MM-DD',
        variant: 'destructive',
      });
      return;
    }

    // Validate time format (HH:mm)
    const timeRegex = /^\d{2}:\d{2}$/;
    for (const time of formData.timeSlots) {
      if (!timeRegex.test(time)) {
        toast({
          title: 'Lỗi Xác Thực',
          description: `Định dạng giờ không hợp lệ: ${time}. Phải là HH:mm`,
          variant: 'destructive',
        });
        return;
      }
    }

    // Validate date range
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (startDate > endDate) {
      toast({
        title: 'Lỗi Xác Thực',
        description: 'Ngày bắt đầu không thể sau ngày kết thúc',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Convert admin form shape to API request shape
      // BE expects startDate/endDate at root level, not in dateRange wrapper
      const apiRequest = {
        movieId: formData.movieId,
        movieReleaseId: formData.movieReleaseId,
        cinemaId: formData.cinemaId,
        hallId: formData.hallId,
        startDate: formData.startDate, // String in YYYY-MM-DD format
        endDate: formData.endDate, // String in YYYY-MM-DD format
        timeSlots: formData.timeSlots, // Array of HH:mm strings
        repeatType: formData.repeatType, // Add required field for BE
        weekdays: formData.weekdays || [], // Add required field for BE
        format: formData.format as unknown as ApiShowtimeFormat,
        language: formData.language,
        subtitles: formData.subtitles || [],
      };

      console.log('[BatchShowtimes] Submitting request with data:', apiRequest);

      const response = await batchCreateMutation.mutateAsync(
        apiRequest as ApiBatchCreateRequest
      );
      // The backend returns an array of created showtimes (Showtime[]). Normalize to BatchCreateResponse
      let normalized: BatchCreateResponse;
      if (Array.isArray(response)) {
        const created = (response as ApiShowtime[]).map((s) => ({
          id: s.id,
          startTime: s.startTime,
        }));
        normalized = {
          createdCount: created.length,
          skippedCount: 0,
          created,
          skipped: [],
        };
      } else {
        // Fallback if API returns BatchCreateResponse directly
        normalized = response as unknown as BatchCreateResponse;
      }
      setResult(normalized);

      const selectedMovie = movies.find((m) => m.id === formData.movieId);
      const selectedCinema = cinemas.find((c) => c.id === formData.cinemaId);
      const selectedHall = halls.find((h) => h.id === formData.hallId);

      setHistory((prev) => [
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          movie: selectedMovie?.title || 'Không Xác Định',
          cinema: selectedCinema?.name || 'Không Xác Định',
          hall: selectedHall?.name || 'Không Xác Định',
          period: `${formData.startDate} → ${formData.endDate}`,
          result: normalized,
        },
        ...prev,
      ]);

      toast({
        title: 'Thành Công',
        description: `Đã tạo ${normalized.createdCount} suất chiếu`,
      });
    } catch (error) {
      console.error('[BatchShowtimes] Submission error:', error);

      // Extract error message from different error formats
      let errorMessage = 'Không tạo được suất chiếu';
      let statusCode: number | undefined;

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const err = error as any;

        // Check for API response error
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
          statusCode = err.response?.status;
        } else if (err.message) {
          errorMessage = err.message;
        }

        // Log detailed error info for debugging
        console.error('[BatchShowtimes] Detailed error info:', {
          statusCode: err.response?.status,
          errorCode: err.code,
          message: err.message,
          responseData: err.response?.data,
          requestData: formData,
        });
      }

      // Show detailed error to user
      let displayMessage = errorMessage;
      if (statusCode === 400) {
        displayMessage = `Lỗi xác thực: ${errorMessage}`;
      } else if (statusCode === 500) {
        displayMessage = `Lỗi máy chủ (500): ${errorMessage}. Kiểm tra bảng điều khiển trình duyệt để biết thêm chi tiết.`;
      }

      toast({
        title: 'Lỗi',
        description: displayMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-500" />
            Tạo suất chiếu hàng loạt
          </h1>
          <p className="text-gray-500 mt-1">
            Tạo nhiều suất chiếu cùng lúc với lịch trình thông minh
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5 text-purple-600" />
                Phim & Phát Hành
              </CardTitle>
              <CardDescription>
                Chọn phim và khoảng thời gian phát hành
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="movieId">Phim *</Label>
                {preSelectedMovieId ? (
                  <Input
                    value={
                      movies.find((m) => m.id === formData.movieId)?.title || ''
                    }
                    disabled
                    className="bg-gray-50"
                  />
                ) : (
                  <Select
                    value={formData.movieId}
                    onValueChange={handleMovieChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phim" />
                    </SelectTrigger>
                    <SelectContent>
                      {movies.map((movie) => (
                        <SelectItem key={movie.id} value={movie.id}>
                          {movie.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="movieReleaseId">
                  Khoảng Thời Gian Phát Hành *
                </Label>
                {preSelectedReleaseId ? (
                  <Input
                    value={(() => {
                      const release = movieReleases.find(
                        (r: any) => r.id === formData.movieReleaseId
                      );
                      if (!release || !release.startDate || !release.endDate)
                        return 'Đang tải...';
                      return `${new Date(
                        release.startDate
                      ).toLocaleDateString()} → ${new Date(
                        release.endDate
                      ).toLocaleDateString()}`;
                    })()}
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
                      <SelectValue placeholder="Chọn khoảng thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      {movieReleases
                        .filter(
                          (r: (typeof movieReleases)[0]) =>
                            r.movieId === formData.movieId
                        )
                        .map((release: (typeof movieReleases)[0]) => (
                          <SelectItem key={release.id} value={release.id}>
                            {new Date(release.startDate).toLocaleDateString()} →{' '}
                            {new Date(release.endDate).toLocaleDateString()}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Rạp & Phòng
              </CardTitle>
              <CardDescription>
                Chọn nơi các bộ phim sẽ được chiếu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cinemaId">Rạp Chiếu *</Label>
                <Select
                  value={formData.cinemaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, cinemaId: value, hallId: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn rạp" />
                  </SelectTrigger>
                  <SelectContent>
                    {cinemas.map((cinema) => (
                      <SelectItem key={cinema.id} value={cinema.id}>
                        {cinema.name} - {cinema.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hallId">Phòng Chiếu *</Label>
                <Select
                  value={formData.hallId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, hallId: value })
                  }
                  disabled={!formData.cinemaId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        formData.cinemaId ? 'Chọn phòng' : 'Chọn rạp trước'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {halls
                      .filter((hall) => hall.cinemaId === formData.cinemaId)
                      .map((hall) => (
                        <SelectItem key={hall.id} value={hall.id}>
                          {hall.name} ({hall.capacity} ghế)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-green-600" />
                Khoảng Thời Gian
              </CardTitle>
              <CardDescription>
                Xác định phạm vi ngày và mô hình lặp lại
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Ngày Bắt Đầu *</Label>
                  <div className="relative">
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="pl-3 pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Ngày Kết Thúc *</Label>
                  <div className="relative">
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="pl-3 pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repeatType">Mô Hình Lặp Lại *</Label>
                <Select
                  value={formData.repeatType}
                  onValueChange={(
                    value: 'DAILY' | 'WEEKLY' | 'CUSTOM_WEEKDAYS'
                  ) => setFormData({ ...formData, repeatType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">
                      🌞 Hằng ngày - Mỗi ngày
                    </SelectItem>
                    <SelectItem value="WEEKLY">
                      📅 Hàng tuần - Một lần mỗi tuần (cùng ngày)
                    </SelectItem>
                    <SelectItem value="CUSTOM_WEEKDAYS">
                      🎯 Tùy chỉnh - Ngày cụ thể
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.repeatType === 'CUSTOM_WEEKDAYS' && (
                <div className="space-y-3">
                  <Label>Chọn ngày trong tuần *</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => (
                      <div key={day.value} className="flex items-center">
                        <Button
                          type="button"
                          variant={
                            formData.weekdays?.includes(day.value)
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => handleWeekdayToggle(day.value)}
                          className={
                            formData.weekdays?.includes(day.value)
                              ? 'bg-purple-600'
                              : ''
                          }
                        >
                          {day.label}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Khung giờ suất chiếu
              </CardTitle>
              <CardDescription>
                Chọn khung giờ suất chiếu (cho phép chọn nhiều)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {TIME_SLOTS.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant={
                      formData.timeSlots.includes(time) ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => handleTimeSlotToggle(time)}
                    className={
                      formData.timeSlots.includes(time)
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                        : ''
                    }
                  >
                    {time}
                  </Button>
                ))}
              </div>
              {formData.timeSlots.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-900">
                    Selected: {formData.timeSlots.join(', ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Định dạng & Ngôn ngữ</CardTitle>
              <CardDescription>
                Cấu hình định dạng và cài đặt âm thanh của suất chiếu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="format">Định Dạng *</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(value) =>
                      setFormData({ ...formData, format: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TWO_D">2D</SelectItem>
                      <SelectItem value="THREE_D">3D</SelectItem>
                      <SelectItem value="IMAX">IMAX</SelectItem>
                      <SelectItem value="FOUR_DX">4DX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Ngôn Ngữ *</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) =>
                      setFormData({ ...formData, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              <div className="space-y-2">
                <Label>Phụ Đề</Label>
                <div className="flex flex-wrap gap-2">
                  {['vi', 'en', 'ko', 'zh', 'ja', 'th'].map((sub) => (
                    <div key={sub} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sub-${sub}`}
                        checked={formData.subtitles.includes(sub)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              subtitles: [...formData.subtitles, sub],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              subtitles: formData.subtitles.filter(
                                (s) => s !== sub
                              ),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`sub-${sub}`} className="cursor-pointer">
                        {sub.toUpperCase()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>{' '}
            </CardContent>
          </Card>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-4 border-white border-r-transparent mr-2" />
                Đang tạo suất chiếu...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                Tạo suất chiếu
              </>
            )}
          </Button>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">📋 Tóm Tắt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.movieId && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Phim</p>
                  <p className="font-semibold text-sm">
                    {movies.find((m) => m.id === formData.movieId)?.title ||
                      'Không Xác Định'}
                  </p>
                </div>
              )}

              {formData.cinemaId && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Rạp</p>
                  <p className="font-semibold text-sm">
                    {cinemas.find((c) => c.id === formData.cinemaId)?.name ||
                      'Không Xác Định'}
                  </p>
                </div>
              )}

              {formData.hallId && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Phòng</p>
                  <p className="font-semibold text-sm">
                    {halls.find((h) => h.id === formData.hallId)?.name ||
                      'Không Xác Định'}
                  </p>
                </div>
              )}

              {formData.startDate && formData.endDate && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Khoảng Thời Gian</p>
                  <p className="font-semibold text-sm">
                    {formData.startDate} → {formData.endDate}
                  </p>
                </div>
              )}

              {formData.timeSlots.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Khung Giờ</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.timeSlots.map((time) => (
                      <Badge key={time} variant="secondary" className="text-xs">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 mb-2">
                    Định Dạng & Âm Thanh
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">
                      Định Dạng:
                    </span>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                      🎬 {FORMAT_LABELS[formData.format] || formData.format}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">
                      Ngôn Ngữ:
                    </span>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      🎙️ {formData.language.toUpperCase()}
                    </Badge>
                  </div>

                  {formData.subtitles.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-gray-600 mt-1">
                        Phụ Đề:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {formData.subtitles.map((sub) => (
                          <Badge
                            key={sub}
                            className="bg-green-100 text-green-700 border-green-200 text-xs"
                          >
                            📝 {sub.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {result && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg text-green-900">
                  ✅ Kết Quả
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="text-sm font-medium">Đã Tạo</span>
                  <span className="text-2xl font-bold text-green-600">
                    {result.createdCount}
                  </span>
                </div>

                {result.skippedCount > 0 && (
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium">Bỏ Qua</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {result.skippedCount}
                    </span>
                  </div>
                )}

                {result.skipped && result.skipped.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-700">
                      Các Mục Bỏ Qua:
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {result.skipped.map((item, idx) => (
                        <div key={idx} className="text-xs p-2 bg-white rounded">
                          <p className="font-medium">{item.start}</p>
                          <p className="text-gray-600">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-purple-600" />
              Lịch Sử Tạo Hàng Loạt
            </CardTitle>
            <CardDescription>
              Các hoạt động tạo hàng loạt gần đây trong phiên này
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg hover:border-purple-200 hover:bg-purple-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {item.movie}
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>
                          🎭 {item.cinema} - {item.hall}
                        </p>
                        <p>📅 {item.period}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-700">
                            ✅ {item.result.createdCount} suất đã được tạo
                          </Badge>
                          {item.result.skippedCount > 0 && (
                            <Badge className="bg-orange-100 text-orange-700">
                              ⚠️ {item.result.skippedCount} bỏ qua
                            </Badge>
                          )}
                        </div>
                        <p
                          className="text-xs text-gray-500 mt-1"
                          suppressHydrationWarning
                        >
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {item.result.created && item.result.created.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600">
                          {item.result.created.length} suất chiếu đã được tạo
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() =>
                            (window.location.href = '/admin/showtimes')
                          }
                        >
                          Xem Trong Suất Chiếu
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function BatchShowtimesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BatchShowtimesContent />
    </Suspense>
  );
}
