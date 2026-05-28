import { clientQueryKeys } from '@/features/client/shared/query-keys';
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
      const response = await getShowtimeSeats(showtimeId);
      return response.data;
    },
    enabled: !!showtimeId,
  });
};

export const useGetSessionTTL = (showtimeId: string) => {
  return useQuery({
    queryKey: clientQueryKeys.showtimes.ttl(showtimeId),
    queryFn: async () => {
      const response = await getSessionTTL(showtimeId);
      return response.data;
    },
    enabled: !!showtimeId,
    staleTime: 3000,
    gcTime: 5000,
  });
};
