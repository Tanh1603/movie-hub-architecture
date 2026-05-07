'use client';

import { useState, useEffect, startTransition } from 'react';
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
import { Textarea } from '@movie-hub/shacdn-ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import { Button } from '@movie-hub/shacdn-ui/button';
import { useToast } from '../../_libs/use-toast';
import { useCreateMovieRelease, useUpdateMovieRelease, useMovieRelease } from '@/libs/api';
import { moviesApi } from '@/libs/api/services';
import type { Movie, MovieRelease, CreateMovieReleaseRequest, UpdateMovieReleaseRequest } from '@/libs/api/types';

// Helper to validate UUID format
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

interface MovieReleaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movies: Movie[];
  editingRelease?: MovieRelease | null;
  preSelectedMovieId?: string; // Pre-select movie and disable dropdown
  onSuccess?: () => void;
}

export default function MovieReleaseDialog({
  open,
  onOpenChange,
  movies,
  editingRelease,
  preSelectedMovieId,
  onSuccess,
}: MovieReleaseDialogProps) {
  const createMovieRelease = useCreateMovieRelease();
  const updateMovieRelease = useUpdateMovieRelease();
  const { data: fetchedReleaseDetail } = useMovieRelease(editingRelease?.id || null);
  const fullReleaseDetail = fetchedReleaseDetail || editingRelease;
  const [formData, setFormData] = useState({
    movieId: '',
    startDate: '',
    endDate: '',
    note: '',
  });
  // Track enriched movie data separately to ensure consistent display
  const [enrichedMovie, setEnrichedMovie] = useState<Movie | null>(null);
  const { toast } = useToast();

  // When fetchedReleaseDetail changes and has movieId, fetch the full movie details if not already loaded
  useEffect(() => {
    if (fetchedReleaseDetail?.movieId && !fetchedReleaseDetail?.movie && !enrichedMovie) {
      // Fetch movie details to enrich the release
      (async () => {
        try {
          const movie = await moviesApi.getById(fetchedReleaseDetail.movieId);
          if (movie) {
            setEnrichedMovie(movie);
          }
        } catch (error) {
          console.warn('[MovieReleaseDialog] Failed to fetch movie details:', error);
        }
      })();
    }
  }, [fetchedReleaseDetail?.movieId, fetchedReleaseDetail?.movie, enrichedMovie]);

  // Reset enriched movie when dialog closes or editingRelease changes
  useEffect(() => {
    if (!open || !editingRelease) {
      setEnrichedMovie(null);
    }
  }, [open, editingRelease]);

  useEffect(() => {
    if (fullReleaseDetail) {
      // Helper to format date - handle both string and Date objects
      const formatDate = (date: string | Date | undefined): string => {
        if (!date) return '';
        if (typeof date === 'string') {
          // If it's already in YYYY-MM-DD format, return as-is
          if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return date;
          }
          // If it's ISO format with time, extract date part
          return date.split('T')[0];
        }
        // If it's a Date object, convert to YYYY-MM-DD
        return date.toISOString().split('T')[0];
      };

      setFormData({
        // Fall back to fullReleaseDetail.movie?.id when movieId missing from BE
        movieId: fullReleaseDetail.movieId || fullReleaseDetail.movie?.id || '',
        startDate: formatDate(fullReleaseDetail.startDate),
        endDate: formatDate(fullReleaseDetail.endDate),
        note: fullReleaseDetail.note || '',
      });
    } else if (preSelectedMovieId) {
      // Pre-fill movieId when opening from Movies page
      setFormData({
        movieId: preSelectedMovieId,
        startDate: '',
        endDate: '',
        note: '',
      });
    } else {
      setFormData({
        movieId: '',
        startDate: '',
        endDate: '',
        note: '',
      });
    }
  }, [fullReleaseDetail, preSelectedMovieId, open]);

  const resetForm = () => {
    setFormData({
      movieId: preSelectedMovieId || '',
      startDate: '',
      endDate: '',
      note: '',
    });
  };

  // Calculate selectedMovie: prioritize enrichedMovie -> fullReleaseDetail.movie -> movies list lookup
  const selectedId = formData.movieId || fullReleaseDetail?.movieId || '';
  const selectedMovie = enrichedMovie || fullReleaseDetail?.movie || movies.find((m) => m.id === selectedId);
  const selectedLabel = selectedMovie
    ? `${selectedMovie.title} (${selectedMovie.runtime} mins)`
    : (selectedId ? `Movie (${selectedId})` : undefined);
  const isMovieDisabled = !!preSelectedMovieId;

  const handleSubmit = async () => {
    // Validate: movieId and startDate are required, endDate is optional
    if (!formData.movieId || !formData.startDate) {
      toast({
        title: 'Lỗi xác thực',
        description: 'Vui lòng điền tất cả trường bắt buộc: Phim, Ngày bắt đầu',
        variant: 'destructive',
      });
      return;
    }

    // Validate movieId is a proper UUID format
    if (!isValidUUID(formData.movieId)) {
      toast({
        title: 'Lỗi Xác Thực',
        description: 'Định dạng ID phim không hợp lệ. Vui lòng chọn một phim hợp lệ từ danh sách.',
        variant: 'destructive',
      });
      console.warn('[MovieReleaseDialog] Invalid movieId format:', formData.movieId);
      return;
    }

    try {
      // Build payloads: create requires movieId, update should not change relation
      const startDateISO = new Date(formData.startDate).toISOString();
      const endDateISO = formData.endDate ? new Date(formData.endDate).toISOString() : undefined;
      const noteValue = formData.note && formData.note.trim() ? formData.note : undefined;

      const createPayload: CreateMovieReleaseRequest = {
        movieId: formData.movieId,
        startDate: startDateISO,
        ...(endDateISO && { endDate: endDateISO }),
        ...(noteValue && { note: noteValue }),
      };

      // For update, include movieId (BE requires it for validation)
      const updatePayload: UpdateMovieReleaseRequest = {
        movieId: formData.movieId,
        startDate: startDateISO,
        ...(endDateISO && { endDate: endDateISO }),
        ...(noteValue && { note: noteValue }),
      };

      // Detailed debug log: inspect payload before submit
      console.log('[MovieReleaseDialog] Form data:', formData);
      console.log('[MovieReleaseDialog] Parsed dates:');
      console.log('  startDate ISO:', startDateISO);
      console.log('  endDate input:', formData.endDate);
      console.log('  endDate ISO:', endDateISO);
      console.log('[MovieReleaseDialog] Note field:', formData.note, '-> will include:', !!noteValue);
      console.log('[MovieReleaseDialog] Final payload (create):', JSON.stringify(createPayload, null, 2));
      console.log('[MovieReleaseDialog] Final payload (update):', JSON.stringify(updatePayload, null, 2));

      if (fullReleaseDetail) {
        // For update, include all fields including movieId
        await updateMovieRelease.mutateAsync({ id: fullReleaseDetail.id, data: updatePayload });
      } else {
        console.log('[MovieReleaseDialog] Sending CREATE request with:', createPayload);
        await createMovieRelease.mutateAsync(createPayload);
      }

      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error('[MovieReleaseDialog] Catch block error:', error);
      // Error toast already shown by mutation hooks
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{fullReleaseDetail ? 'Chỉnh sửa phát hành' : 'Thêm phát hành mới'}</DialogTitle>
          <DialogDescription>
            {fullReleaseDetail ? 'Cập nhật chi tiết lịch phát hành' : 'Tạo lịch phát hành phim mới'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="movieId">Phim *</Label>
            {movies.length === 0 ? (
              <div className="text-sm text-red-600 p-2 border border-red-300 rounded bg-red-50">
                Không có phim khả dụng. Vui lòng thêm phim trước khi tạo phát hành.
              </div>
            ) : ( 
            <Select
              value={selectedId}
              onValueChange={(value: string) => {
                // Use startTransition to schedule a low-priority state update
                // which avoids synchronous unmounts of portal children
                startTransition(() => {
                  setFormData((prev) => ({ ...prev, movieId: value }));
                });
              }}
              disabled={isMovieDisabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn phim">
                  {selectedLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {fullReleaseDetail && !movies.find(m => m.id === fullReleaseDetail.movieId) && (
                  <SelectItem key={`injected-${fullReleaseDetail.movieId}`} value={fullReleaseDetail.movieId}>
                    {fullReleaseDetail.movie ? `${fullReleaseDetail.movie.title} (${fullReleaseDetail.movie.runtime} phút) - Hiện tại` : `Phim (${fullReleaseDetail.movieId}) - Hiện tại`}
                  </SelectItem>
                )}
                {movies.map((movie) => (
                  <SelectItem key={movie.id} value={movie.id}>
                    {movie.title} ({movie.runtime} phút)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Ngày Bắt Đầu *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Ngày Kết Thúc (Tùy Chọn)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Ghi Chú</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, note: e.target.value })
              }
              placeholder="VD: Phát hành dịp Tết Nguyên Đán 2025"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Hủy Bỏ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.movieId || !formData.startDate || (movies.length === 0 && !fullReleaseDetail)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingRelease ? 'Cập Nhật Phát Hành' : 'Tạo Phát Hành'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
