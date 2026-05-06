import {
  isServer,
  MutationCache,
  QueryClient
} from '@tanstack/react-query';
import { toast } from 'sonner';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 5 * 60 * 1000,
        gcTime: 1000 * 60 * 60 * 24,
        retry: 2,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
    mutationCache: new MutationCache({
      onError: (error, _mutation) => {
        if (isServer) {
          console.error('Mutation error:', error);
        }
        toast.error(
          error?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.'
        );
      }
    })
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
