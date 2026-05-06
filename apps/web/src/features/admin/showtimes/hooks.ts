import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { showtimesApi } from '@/libs/api';
import type { CreateShowtimeRequest, Showtime, ShowtimeFiltersParams, UpdateShowtimeRequest } from '@/libs/api/types';
import { adminInvalidation } from '../shared/invalidation';
import { adminQueryKeys } from '../shared/query-keys';

export const useAdminShowtimes = (filters?: ShowtimeFiltersParams) =>
  useQuery({
    queryKey: adminQueryKeys.showtimes.list(filters),
    queryFn: () => showtimesApi.getWithFilters(filters || {}),
  });

export const useAdminShowtime = (id: string | null) =>
  useQuery({
    queryKey: adminQueryKeys.showtimes.detail(id || ''),
    queryFn: () => {
      if (!id) throw new Error('ID is required');
      return showtimesApi.getById(id);
    },
    enabled: !!id,
  });

export const useAdminCreateShowtime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShowtimeRequest) => showtimesApi.create(data),
    onSuccess: () => {
      adminInvalidation.showtimes(queryClient);
      toast.success('Showtime created successfully');
    },
  });
};

export const useAdminUpdateShowtime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateShowtimeRequest }) =>
      showtimesApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.showtimes.lists() });
      const previous = queryClient.getQueriesData<Showtime[]>({
        queryKey: adminQueryKeys.showtimes.lists(),
      });
      queryClient.setQueriesData<Showtime[]>(
        { queryKey: adminQueryKeys.showtimes.lists() },
        (old) => old?.map((showtime) => (showtime.id === id ? { ...showtime, ...data } : showtime))
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      context?.previous?.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast.error('Failed to update showtime');
    },
    onSuccess: () => {
      adminInvalidation.showtimes(queryClient);
      toast.success('Showtime updated successfully');
    },
  });
};

export const useAdminDeleteShowtime = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => showtimesApi.delete(id),
    onSuccess: () => {
      adminInvalidation.showtimes(queryClient);
      toast.success('Showtime deleted successfully');
    },
  });
};

