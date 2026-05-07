import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetShowtimesQuerySchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'date must be in format yyyy-MM-dd',
      })
      .optional(),
  })
  .strict();

export class GetShowtimesQuery extends createZodDto(GetShowtimesQuerySchema) {}
