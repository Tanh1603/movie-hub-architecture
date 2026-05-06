import type { QueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from './query-keys';

export const adminInvalidation = {
  genres(queryClient: QueryClient) {
    return queryClient.invalidateQueries({ queryKey: adminQueryKeys.genres.all });
  },
  movies(queryClient: QueryClient) {
    return queryClient.invalidateQueries({ queryKey: adminQueryKeys.movies.all });
  },
  movieReleases(queryClient: QueryClient) {
    return queryClient.invalidateQueries({
      queryKey: adminQueryKeys.movieReleases.all,
    });
  },
  cinemas(queryClient: QueryClient) {
    return queryClient.invalidateQueries({ queryKey: adminQueryKeys.cinemas.all });
  },
  showtimes(queryClient: QueryClient) {
    return queryClient.invalidateQueries({ queryKey: adminQueryKeys.showtimes.all });
  },
};
