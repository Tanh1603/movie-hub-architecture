import { FormatEnum, ShowtimeStatusEnum } from '@movie-hub/shared-types/cinema/enum';
import { z } from 'zod';

// yyyy-MM-dd (2025-12-15)
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// HH:mm (23:59)
const TIME_REGEX = /^\d{2}:\d{2}$/;

export const batchCreateShowtimesSchema = z.object({
  movieId: z.string().min(1, 'movieId không được để trống'),
  movieReleaseId: z.string().min(1, 'movieReleaseId không được để trống'),
  cinemaId: z.string().min(1, 'cinemaId không được để trống'),
  hallId: z.string().min(1, 'hallId không được để trống'),

  // yyyy-MM-dd → Date
  startDate: z
    .string()
    .regex(DATE_REGEX, 'startDate phải theo format yyyy-MM-dd'),

  endDate: z.string().regex(DATE_REGEX, 'endDate phải theo format yyyy-MM-dd'), // cho dễ tính range

  // danh sách giờ trong ngày ["10:00", "13:30", ...]
  timeSlots: z.array(
    z.string().regex(TIME_REGEX, 'timeSlot phải theo format HH:mm')
  ),

  repeatType: z.enum(['DAILY', 'WEEKLY', 'CUSTOM_WEEKDAYS']),

  // các thứ trong tuần [0..6]
  weekdays: z.array(z.number().min(0).max(6)).optional().default([]),

  format: z
    .enum(Object.values(FormatEnum) as [string, ...string[]])
    .default(FormatEnum.TWO_D),

  language: z.string().min(1),
  subtitles: z.array(z.string()).optional().default([]),

  status: z
    .enum(Object.values(ShowtimeStatusEnum) as [string, ...string[]])
    .optional()
    .default(ShowtimeStatusEnum.SELLING),
});

export type BatchCreateShowtimesInput = z.infer<
  typeof batchCreateShowtimesSchema
>;
