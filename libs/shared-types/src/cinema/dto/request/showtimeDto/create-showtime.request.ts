import { FormatEnum, ShowtimeStatusEnum } from '@movie-hub/shared-types/cinema/enum';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Regex cho yyyy-MM-dd HH:mm:ss (giây có thể optional)
const DATE_TIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/;

export const createShowtimeSchema = z.object({
  movieId: z.string().min(1, 'movieId không được để trống'),
  movieReleaseId: z.string().min(1, 'movieReleaseId không được để trống'),
  cinemaId: z.string().min(1, 'cinemaId không được để trống'),
  hallId: z.string().min(1, 'hallId không được để trống'),

  startTime: z
    .string()
    .regex(DATE_TIME_REGEX, 'startTime phải theo format yyyy-MM-dd HH:mm:ss'),

  format: z
    .enum(Object.values(FormatEnum) as [string, ...string[]])
    .default(FormatEnum.TWO_D),

  language: z
    .string()
    .min(1, { message: 'language không được để trống' })
    .max(10, { message: 'language quá dài' }),

  subtitles: z.array(z.string()).optional().default([]),

  status: z
    .enum(Object.values(ShowtimeStatusEnum) as [string, ...string[]])
    .optional()
    .default(ShowtimeStatusEnum.SELLING),
});

export class CreateShowtimeRequest extends createZodDto(createShowtimeSchema) {}
