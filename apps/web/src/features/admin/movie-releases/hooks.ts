import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { movieReleasesApi } from '@/api';
import type {
  CreateMovieReleaseRequest,
  MovieRelease,
  UpdateMovieReleaseRequest,
} from '@/types';
import { adminInvalidation } from '../shared/invalidation';
import { adminQueryKeys } from '../shared/query-keys';

export const useAdminMovieReleases = (params?: {
  cinemaId?: string;
  movieId?: string;
}) =>
  useQuery({
    queryKey: adminQueryKeys.movieReleases.list(params),
    queryFn: async () => {
      const response = await movieReleasesApi.getAll(params);
      return response.data;
    },
  });

export const useAdminMovieRelease = (id: string | null) =>
  useQuery({
    queryKey: adminQueryKeys.movieReleases.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('ID is required');
      const response = await movieReleasesApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });

export const useAdminCreateMovieRelease = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMovieReleaseRequest) => movieReleasesApi.create(data),
    onSuccess: () => {
      adminInvalidation.movieReleases(queryClient);
      toast.success('Movie release created successfully');
    },
  });
};

export const useAdminUpdateMovieRelease = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMovieReleaseRequest }) =>
      movieReleasesApi.update(id, data),
    onSuccess: () => {
      adminInvalidation.movieReleases(queryClient);
      toast.success('Movie release updated successfully');
    },
  });
};

export const useAdminDeleteMovieRelease = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => movieReleasesApi.delete(id),
    onSuccess: () => {
      adminInvalidation.movieReleases(queryClient);
      toast.success('Movie release deleted successfully');
    },
  });
};

export const upsertMovieReleaseInList = (
  list: MovieRelease[],
  release: MovieRelease
): MovieRelease[] => {
  const found = list.some((item) => item.id === release.id);
  if (found) return list.map((item) => (item.id === release.id ? release : item));
  return [release, ...list];
};

