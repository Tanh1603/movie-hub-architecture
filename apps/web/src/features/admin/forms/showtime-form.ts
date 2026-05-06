import type { CreateShowtimeRequest, Showtime, UpdateShowtimeRequest } from '@/libs/api/types';
import { FormatEnum } from '@movie-hub/shared-types/cinema/enum';

export const createDefaultShowtimeForm = (): CreateShowtimeRequest => ({
  movieId: '',
  movieReleaseId: '',
  cinemaId: '',
  hallId: '',
  startTime: '',
  format: FormatEnum.TWO_D,
  language: 'vi',
  subtitles: [],
});

export const mapShowtimeToForm = (showtime: Showtime): CreateShowtimeRequest => ({
  movieId: showtime.movieId,
  movieReleaseId: showtime.movieReleaseId || '',
  cinemaId: showtime.cinemaId,
  hallId: showtime.hallId,
  startTime: showtime.startTime,
  format: showtime.format,
  language: showtime.language,
  subtitles: showtime.subtitles || [],
});

export const toCreateShowtimeRequest = (
  values: CreateShowtimeRequest
): CreateShowtimeRequest => values;

export const toUpdateShowtimeRequest = (
  values: CreateShowtimeRequest
): UpdateShowtimeRequest => values;

