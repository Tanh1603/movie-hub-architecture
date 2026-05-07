import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getAllMoviesWithShowtimes,
  getCinemaDetail,
  GetCinemasNearby,
  getCinemasWithFilters,
  getMovieAtCinemas,
  getMovieShowtimesAtCinema,
  GetShowtimesQuery,
  searchCinemas,
  ShowtimesFilterDTO,
  getAllCinemas,
} from '../libs/actions/cinemas/cinema-action';
import {
  CinemaListResponse,
  CinemaLocationResponse,
} from '../libs/types/cinema.type';
import { PaginationQuery, ServiceResult } from '@movie-hub/shared-types/common';
import { ShowtimeSummaryResponse } from '@movie-hub/shared-types';
import { MovieWithShowtimeResponse } from '../libs/types/movie.type';

export const useGetMovieShowtimesAtCinema = (
  cinemaId: string,
  movieId: string,
  query: GetShowtimesQuery
) => {
  return useQuery({
    queryKey: ['cinemas', cinemaId, movieId, query],
    queryFn: async () => {
      const response: ServiceResult<ShowtimeSummaryResponse[]> =
        await getMovieShowtimesAtCinema(cinemaId, movieId, query);

      return response.data;
    },
  });
};

export const useGetCinemasNearby = (
  langtitude: number,
  longtitude: number,
  radius?: number,
  limit?: number
) => {
  return useQuery({
    queryKey: ['cinemas', 'nearby', langtitude, longtitude, radius, limit],
    queryFn: async () => {
      const response: ServiceResult<CinemaListResponse> =
        await GetCinemasNearby(langtitude, longtitude, radius, limit);
      return response.data;
    },
    enabled: !!langtitude && !!longtitude,
  });
};

export const useGetCinemasWithFilters = (params: {
  lat?: string;
  lon?: string;
  radius?: string;
  city?: string;
  district?: string;
  amenities?: string;
  hallTypes?: string;
  minRating?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) => {
  return useInfiniteQuery<CinemaListResponse>({
    queryKey: ['cinemas', params],
    queryFn: async ({ pageParam = 1 }) => {
      const response: ServiceResult<CinemaListResponse> =
        await getCinemasWithFilters({
          ...params,
          page: pageParam as number,
        });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!params,
  });
};

export const useSearchCinemas = (
  query: string,
  longitude?: string,
  latitude?: string
) => {
  return useQuery({
    queryKey: ['cinemas', 'search', query, longitude, latitude],
    queryFn: async () => {
      const response: ServiceResult<CinemaLocationResponse[]> =
        await searchCinemas(query, longitude, latitude);
      return response.data;
    },
    enabled: query.trim().length > 0,
  });
};

export const useGetCinemaDetail = (cinemaId: string) => {
  return useQuery({
    queryKey: ['cinemas', 'detail', cinemaId],
    queryFn: async () => {
      const response: ServiceResult<CinemaLocationResponse> =
        await getCinemaDetail(cinemaId);
      return response.data;
    },
    enabled: !!cinemaId,
  });
};

export const useGetMoviesAtCinema = (
  cinemaId: string,
  query: PaginationQuery
) => {
  return useInfiniteQuery({
    queryKey: ['movies-at-cinema', cinemaId, query],
    queryFn: async ({ pageParam = 1 }) => {
      // gọi getMovies và merge query params
      return await getMovieAtCinemas(cinemaId, {
        ...query,
        page: pageParam,
      } as PaginationQuery);
    },
    getNextPageParam: (
      lastPage: ServiceResult<MovieWithShowtimeResponse[]>
    ) => {
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
export const useGetAllMoviesWithShowtimes = (query: ShowtimesFilterDTO) => {
  return useQuery({
    queryKey: ['movies-with-showtimes', query],
    queryFn: async () => {
      const response = await getAllMoviesWithShowtimes(query);
      return response.data;
    },
  });
};

export const useGetAllCinemas = () => {
  return useQuery({
    queryKey: ['cinemas', 'all'],
    queryFn: async () => {
      const response = await getAllCinemas();
      return response.data;
    },
  });
};
