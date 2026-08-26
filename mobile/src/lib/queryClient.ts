import { QueryClient } from '@tanstack/react-query';
import { ApiRequestError } from '../api/types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Never retry auth/permission failures — they won't fix themselves,
        // and 401 is already handled once by the client's refresh interceptor.
        if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
