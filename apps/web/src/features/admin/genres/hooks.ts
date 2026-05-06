import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { genresApi } from '@/libs/api';
import type {
  CreateGenreRequest,
  Genre,
  UpdateGenreRequest,
} from '@/libs/api/types';
import { adminInvalidation } from '../shared/invalidation';
import { adminQueryKeys } from '../shared/query-keys';

export const useAdminGenres = () =>
  useQuery({
    queryKey: adminQueryKeys.genres.lists(),
    queryFn: () => genresApi.getAll(),
  });

export const useAdminCreateGenre = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGenreRequest) => genresApi.create(data),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.genres.lists() });
      const previous = queryClient.getQueryData<Genre[]>(
        adminQueryKeys.genres.lists()
      );
      queryClient.setQueryData<Genre[]>(
        adminQueryKeys.genres.lists(),
        (old) => {
          if (!old) return old;
          const optimistic: Genre = { id: `optimistic-${Date.now()}`, name: payload.name };
          return [optimistic, ...old];
        }
      );
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(adminQueryKeys.genres.lists(), context.previous);
      }
      toast.error('Failed to create genre');
    },
    onSuccess: () => {
      adminInvalidation.genres(queryClient);
      toast.success('Genre created successfully');
    },
  });
};

export const useAdminUpdateGenre = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGenreRequest }) =>
      genresApi.update(id, data),
    onSuccess: () => {
      adminInvalidation.genres(queryClient);
      toast.success('Genre updated successfully');
    },
  });
};

export const useAdminDeleteGenre = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => genresApi.delete(id),
    onSuccess: () => {
      adminInvalidation.genres(queryClient);
      toast.success('Genre deleted successfully');
    },
  });
};

