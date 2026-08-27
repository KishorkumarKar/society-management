import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { describeQueryError } from '../../lib/describeQueryError';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { listPermissions } from '../../api/endpoints/permissions';

// GET /permissions is unpaginated (backend/src/modules/permissions/
// permissions.controller.ts) — the full permission catalog is small and
// mostly static (seeded), so a plain list is enough here.
export function PermissionsListScreen() {
  const { theme } = useAppTheme();
  const query = useQuery({ queryKey: ['permissions'], queryFn: listPermissions });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) {
    const { message, requestId } = describeQueryError(query.error, 'Could not load permissions.');
    return <ErrorState message={message} onRetry={() => query.refetch()} requestId={requestId} />;
  }

  const grouped = query.data.reduce<Record<string, typeof query.data>>((acc, p) => {
    (acc[p.resource] ??= []).push(p);
    return acc;
  }, {});

  return (
    <Screen>
      <FlatList
        data={Object.entries(grouped)}
        keyExtractor={([resource]) => resource}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item: [resource, perms] }) => (
          <Card>
            <Text style={[styles.resource, { color: theme.text }]}>{resource}</Text>
            <View style={{ marginTop: 8, gap: 6 }}>
              {perms.map((p) => (
                <Text key={p.id} style={[styles.action, { color: theme.textMuted }]}>· {p.action}</Text>
              ))}
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  resource: { fontFamily: fontFamilies.mono, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  action: { fontFamily: fontFamilies.sans, fontSize: 13 },
});
