import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cinemasApi, hallsApi } from '@/api';
import type { Cinema, CreateCinemaRequest, UpdateCinemaRequest } from '@/types';
import { adminInvalidation } from '../shared/invalidation';
import { adminQueryKeys } from '../shared/query-keys';

export const useAdminCinemas = (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) =>
  useQuery({
    queryKey: adminQueryKeys.cinemas.list(params),
    queryFn: () => cinemasApi.getAll(params),
  });

export const useAdminHallsGroupedByCinema = () =>
  useQuery({
    queryKey: adminQueryKeys.cinemas.hallsGrouped(),
    queryFn: () => hallsApi.getAllGroupedByCinema(),
  });

export const useAdminCreateCinema = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCinemaRequest) => cinemasApi.create(data),
    onSuccess: () => {
      adminInvalidation.cinemas(queryClient);
      toast.success('Cinema created successfully');
    },
  });
};

export const useAdminUpdateCinema = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCinemaRequest }) =>
      cinemasApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.cinemas.lists() });
      const previous = queryClient.getQueriesData<Cinema[]>({
        queryKey: adminQueryKeys.cinemas.lists(),
      });
      queryClient.setQueriesData<Cinema[]>(
        { queryKey: adminQueryKeys.cinemas.lists() },
        (old) => old?.map((cinema) => (cinema.id === id ? { ...cinema, ...data } : cinema))
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      context?.previous?.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast.error('Failed to update cinema');
    },
    onSuccess: () => {
      adminInvalidation.cinemas(queryClient);
      toast.success('Cinema updated successfully');
    },
  });
};

export const useAdminDeleteCinema = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cinemasApi.delete(id),
    onSuccess: () => {
      adminInvalidation.cinemas(queryClient);
      toast.success('Cinema deleted successfully');
    },
  });
};

