import { z } from 'zod';
import { ShowtimeStatusEnum } from '@movie-hub/shared-types/cinema/enum';

const optionalStringFromQuery = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  return String(val);
}, z.string().optional());

export const AdminShowtimeFilterSchema = z.object({
  date: optionalStringFromQuery.refine(
    (v) => v === undefined || /^\d{4}-\d{2}-\d{2}$/.test(v),
    { message: 'date must be in YYYY-MM-DD format' }
  ),
  cinemaId: z.string().optional(),
  movieId: z.string().optional(),
  hallId: z.string().optional(),

  status: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      return String(val);
    },
    z
      .enum(Object.values(ShowtimeStatusEnum) as [string, ...string[]])
      .optional()
  ),
});

/** Inferred TypeScript type */
export type AdminShowtimeFilterDTO = z.infer<typeof AdminShowtimeFilterSchema>;
