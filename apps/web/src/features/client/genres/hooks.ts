import { clientQueryKeys } from '@/features/client/shared/query-keys';
import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createGenre,
  getGenreDetail,
  getGenres,
  updateGenre,
} from '@/api/services';
import type { CreateGenreRequest } from '@/types';

export const useGetGenres = (token: string) => {
  return useQuery({
    queryKey: clientQueryKeys.genres.list(),
    queryFn: async () => {
      const response = await getGenres();
      return response.data;
    },
  });
};

export const useGetDetailGenre = (id: string) => {
  return useQuery({
    queryKey: clientQueryKeys.genres.detail(id),
    queryFn: async () => {
      const response = await getGenreDetail(id);
      return response.data;
    },
  });
};

export const useCreateGenre = (data: CreateGenreRequest) => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationKey: ['create-genre'],
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Token is required');
      return await createGenre(data, token);
    },
    onMutate() {
      toast.loading('Đang tạo thể loại...');
    },
    onSuccess: () => {
      toast.success('Tạo thể loại thành công');
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.genres.list() });
    },
    onError: (error) => {
      toast.error(error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    },
  });
};

export const useUpdateGenre = (id: string, genreData: CreateGenreRequest) => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationKey: ['update-genre'],
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Token is required');
      return await updateGenre(id, genreData, token);
    },
    onMutate() {
      toast.loading('Đang cập nhật thể loại...');
    },
    onSuccess: () => {
      toast.success('Cập nhật thể loại thành công');
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.genres.list() });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.genres.detail(id) });
    },
    onError: (error) => {
      toast.error(error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    },
  });
};

export const useDeleteGenre = (id: string) => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationKey: ['delete-genre', id],
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Token is required');
      // return await deleteGenre(id, token);
    },
    onMutate() {
      toast.loading('Đang xóa thể loại...');
    },
    onSuccess: () => {
      toast.success('Xóa thể loại thành công');
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.genres.list() });
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.genres.detail(id) });
    },
    onError: (error) => {
      toast.error(error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    },
  });
};
