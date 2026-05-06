import type { QueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from './query-keys';

export const adminInvalidation = {
  movies(queryClient: QueryClient) {
    return queryClient.invalidateQueries({ queryKey: adminQueryKeys.movies.all });
  },
  cinemas(queryClient: QueryClient) {
    return queryClient.invalidateQueries({ queryKey: adminQueryKeys.cinemas.all });
  },
  showtimes(queryClient: QueryClient) {
    return queryClient.invalidateQueries({ queryKey: adminQueryKeys.showtimes.all });
  },
};

