import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { LoadingState, ErrorState, EmptyState } from './States';
import { ApiPaginated, ApiRequestError } from '../../api/types';

interface EntityListScreenProps<T> {
  queryKey: string;
  fetchPage: (page: number) => Promise<ApiPaginated<T>>;
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
  emptyTitle: string;
  emptySubtitle?: string;
  headerRight?: React.ReactNode;
}

/**
 * Every list module (Users, Maintenance, Announcements, Flats, Expenses,
 * Roles, Notifications, Hall Bookings) is a thin config wrapper around this
 * — same pagination contract, since every GET list endpoint on the backend
 * returns the identical `{success, data, pagination}` envelope. Fetches
 * page-by-page rather than infinite-accumulating, since the API's
 * pagination object already tells us totalPages; "load more" appends.
 */
export function EntityListScreen<T>({
  queryKey,
  fetchPage,
  renderItem,
  keyExtractor,
  emptyTitle,
  emptySubtitle,
}: EntityListScreenProps<T>) {
  const { theme } = useAppTheme();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<T[]>([]);

  const query = useQuery({
    queryKey: [queryKey, page],
    queryFn: () => fetchPage(page),
    placeholderData: keepPreviousData,
  });

  React.useEffect(() => {
    if (!query.data) return;
    setItems((prev) => (page === 1 ? query.data!.data : [...prev, ...query.data!.data]));
  }, [query.data, page]);

  const onRefresh = () => {
    setPage(1);
    query.refetch();
  };

  const onEndReached = () => {
    if (query.data && page < query.data.pagination.totalPages && !query.isFetching) {
      setPage((p) => p + 1);
    }
  };

  if (query.isLoading && items.length === 0) return <LoadingState />;

  if (query.isError && items.length === 0) {
    const message = query.error instanceof ApiRequestError ? query.error.message : 'Could not load this list.';
    const requestId = query.error instanceof ApiRequestError ? query.error.requestId : undefined;
    return <ErrorState message={message} onRetry={() => query.refetch()} requestId={requestId} />;
  }

  if (items.length === 0) return <EmptyState title={emptyTitle} subtitle={emptySubtitle} />;

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      refreshControl={<RefreshControl refreshing={query.isRefetching && page === 1} onRefresh={onRefresh} tintColor={theme.primary} />}
      onEndReachedThreshold={0.4}
      onEndReached={onEndReached}
      renderItem={({ item }) => <View style={{ marginBottom: 2 }}>{renderItem(item)}</View>}
      ListFooterComponent={
        query.isFetching && page > 1 ? (
          <Text style={[styles.footer, { color: theme.textMuted }]}>Loading more…</Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  footer: { textAlign: 'center', fontFamily: fontFamilies.sans, fontSize: 12, paddingVertical: 12 },
});
