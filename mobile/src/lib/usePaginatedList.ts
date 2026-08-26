import { useInfiniteQuery } from '@tanstack/react-query';
import { ApiPaginated } from '../api/types';

/**
 * Every list endpoint returns the same {data, pagination{page,limit,total,
 * totalPages}} shape (backend/src/utils/api-response.ts `paginated()`), so
 * one hook drives every module's FlatList with pull-to-refresh +
 * infinite-scroll instead of re-deriving pagination logic per screen.
 */
export function usePaginatedList<T>(
  queryKey: unknown[],
  fetchPage: (page: number) => Promise<ApiPaginated<T>>,
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages ? lastPage.pagination.page + 1 : undefined,
  });

  const items = query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
