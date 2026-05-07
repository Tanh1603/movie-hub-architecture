import { useAuth } from '@clerk/nextjs';
import {
  MovieDetailResponse,
  MovieQuery,
  MovieSummary,
} from '@movie-hub/shared-types';
import { ServiceResult } from '@movie-hub/shared-types/common';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createMovie,
  CreateMovieRequest,
  deleteMovie,
  getMovieDetail,
  getMovies,
  updateMovie,
  UpdateMovieRequest,
} from '../libs/actions/movies/movie-action';
export const useGetMovies = (initialQuery?: Omit<MovieQuery, 'page'>) => {
  return useInfiniteQuery({
    queryKey: ['movies', initialQuery],
    queryFn: async ({ pageParam = 1 }) => {
      // gọi getMovies và merge query params
      return await getMovies({
        ...initialQuery,
        page: pageParam,
      } as MovieQuery);
    },
    getNextPageParam: (lastPage: ServiceResult<MovieSummary[]>) => {
      const meta = lastPage.meta;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    select: (data) => {
      return {
        pages: data.pages.flatMap((page) => page.data),
        pageParams: data.pageParams,
      };
    },
    initialPageParam: 1,
  });
};

export const useGetMovieDetail = (movieId: string) => {
  return useQuery<ServiceResult<MovieDetailResponse>>({
    queryKey: ['movies', movieId],
    queryFn: async () => {
      return await getMovieDetail(movieId);
    },
  });
};

export const useCreateMovie = (data: CreateMovieRequest) => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationKey: ['create-movie'],
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Token is required');
      return await createMovie(data, token);
    },
    onMutate() {
      toast.loading('Đang tạo phim...');
    },
    onSuccess: () => {
      toast.success('Tạo phim thành công');
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    },
    onError: (error) => {
      toast.error(error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    },
  });
};

export const useUpdateMovie = (movieId: string, data: UpdateMovieRequest) => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationKey: ['update-movie', movieId],
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Token is required');
      return await updateMovie(movieId, data, token);
    },
    onMutate() {
      toast.loading('Đang cập nhật phim...');
    },
    onSuccess: () => {
      toast.success('Cập nhật phim thành công');
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['movies', movieId] });
    },
    onError: (error) => {
      toast.error(error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    },
  });
};

export const useDeleteMovie = (movieId: string) => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationKey: ['delete-movie', movieId],
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Token is required');
      return await deleteMovie(movieId, token);
    },
    onMutate() {
      toast.loading('Đang xóa phim...');
    },
    onSuccess: () => {
      toast.success('Xóa phim thành công');
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['movies', movieId] });
    },
    onError: (error) => {
      toast.error(error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    },
  });
};
