import type { ShowtimeFiltersParams } from '@/libs/api/types';

export const adminQueryKeys = {
  genres: {
    all: ['admin', 'genres'] as const,
    lists: () => [...adminQueryKeys.genres.all, 'list'] as const,
  },
  movies: {
    all: ['admin', 'movies'] as const,
    lists: () => [...adminQueryKeys.movies.all, 'list'] as const,
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      [...adminQueryKeys.movies.lists(), params ?? {}] as const,
    detail: (id: string) => [...adminQueryKeys.movies.all, 'detail', id] as const,
  },
  movieReleases: {
    all: ['admin', 'movie-releases'] as const,
    lists: () => [...adminQueryKeys.movieReleases.all, 'list'] as const,
    list: (params?: { cinemaId?: string; movieId?: string }) =>
      [...adminQueryKeys.movieReleases.lists(), params ?? {}] as const,
    detail: (id: string) =>
      [...adminQueryKeys.movieReleases.all, 'detail', id] as const,
  },
  cinemas: {
    all: ['admin', 'cinemas'] as const,
    lists: () => [...adminQueryKeys.cinemas.all, 'list'] as const,
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      [...adminQueryKeys.cinemas.lists(), params ?? {}] as const,
    detail: (id: string) => [...adminQueryKeys.cinemas.all, 'detail', id] as const,
    hallsGrouped: () => [...adminQueryKeys.cinemas.all, 'halls-grouped'] as const,
  },
  showtimes: {
    all: ['admin', 'showtimes'] as const,
    lists: () => [...adminQueryKeys.showtimes.all, 'list'] as const,
    list: (filters?: ShowtimeFiltersParams) =>
      [...adminQueryKeys.showtimes.lists(), filters ?? {}] as const,
    detail: (id: string) => [...adminQueryKeys.showtimes.all, 'detail', id] as const,
    seats: (id: string) => [...adminQueryKeys.showtimes.detail(id), 'seats'] as const,
  },
};
