import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { moviesApi } from '@/libs/api';
import type { CreateMovieRequest, Movie, UpdateMovieRequest } from '@/libs/api/types';
import { adminInvalidation } from '../shared/invalidation';
import { adminQueryKeys } from '../shared/query-keys';

export const useAdminMovies = (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) =>
  useQuery({
    queryKey: adminQueryKeys.movies.list(params),
    queryFn: () => moviesApi.getAll(params),
  });

export const useAdminCreateMovie = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMovieRequest) => moviesApi.create(data),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.movies.lists() });
      const previous = queryClient.getQueriesData<Movie[]>({
        queryKey: adminQueryKeys.movies.lists(),
      });
      queryClient.setQueriesData<Movie[]>(
        { queryKey: adminQueryKeys.movies.lists() },
        (old) => {
          if (!old) return old;
          const optimistic: Movie = {
            id: `optimistic-${Date.now()}`,
            title: payload.title,
            runtime: payload.runtime,
            releaseDate: payload.releaseDate,
            posterUrl: payload.posterUrl,
            trailerUrl: payload.trailerUrl,
            ageRating: payload.ageRating,
            originalLanguage: payload.originalLanguage,
          };
          return [optimistic, ...old];
        }
      );
      return { previous };
    },
    onError: (_error, _payload, context) => {
      context?.previous?.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast.error('Failed to create movie');
    },
    onSuccess: () => {
      adminInvalidation.movies(queryClient);
      toast.success('Movie created successfully');
    },
  });
};

export const useAdminUpdateMovie = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMovieRequest }) =>
      moviesApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.movies.lists() });
      const previous = queryClient.getQueriesData<Movie[]>({
        queryKey: adminQueryKeys.movies.lists(),
      });
      queryClient.setQueriesData<Movie[]>(
        { queryKey: adminQueryKeys.movies.lists() },
        (old) => old?.map((movie) => (movie.id === id ? { ...movie, ...data } : movie))
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      context?.previous?.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast.error('Failed to update movie');
    },
    onSuccess: () => {
      adminInvalidation.movies(queryClient);
      toast.success('Movie updated successfully');
    },
  });
};

export const useAdminDeleteMovie = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moviesApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.movies.lists() });
      const previous = queryClient.getQueriesData<Movie[]>({
        queryKey: adminQueryKeys.movies.lists(),
      });
      queryClient.setQueriesData<Movie[]>(
        { queryKey: adminQueryKeys.movies.lists() },
        (old) => old?.filter((movie) => movie.id !== id)
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      context?.previous?.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast.error('Failed to delete movie');
    },
    onSuccess: () => {
      adminInvalidation.movies(queryClient);
      toast.success('Movie deleted successfully');
    },
  });
};

