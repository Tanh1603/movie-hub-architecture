import { clientQueryKeys } from '@/features/client/shared/query-keys';
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getSessionTTL,
  getShowtimeSeats,
} from '@/api/services';
import { ApiResponse } from '@movie-hub/shared-types/common';
import { ShowtimeSeatResponse } from '@movie-hub/shared-types';

export const useGetShowtimeSeats = (showtimeId: string) => {
  return useQuery({
    queryKey: clientQueryKeys.showtimes.seats(showtimeId),
    queryFn: async () => {
      const response: ApiResponse<ShowtimeSeatResponse> =
        await getShowtimeSeats(showtimeId);
      if (response.success) {
        return response.data;
      }

      throw new Error(response.message ?? 'Failed to fetch showtime seats');
    },
    enabled: !!showtimeId,
  });
};

export const useGetSessionTTL = (showtimeId: string) => {
  return useQuery({
    queryKey: clientQueryKeys.showtimes.ttl(showtimeId),
    queryFn: async () => {
     return await getSessionTTL(showtimeId);
    },
    enabled: !!showtimeId,
    staleTime: 3000,
    gcTime: 5000,
  });
};
