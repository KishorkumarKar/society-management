import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { getRole, getRolePermissions } from '../../api/endpoints/roles';
import { AppStackParamList } from '../../navigation/types';

type Route = RouteProp<AppStackParamList, 'RoleDetail'>;

// Read-focused: assigning/removing permissions to a role is a deliberate,
// consequential admin action better done with the full context of a desktop
// screen. The mobile app surfaces what a role currently grants; editing
// stays on web for now (the roles.assign_permission endpoints are wired in
// api/endpoints/roles.ts whenever that's ready to add here).
export function RoleDetailScreen() {
  const { params } = useRoute<Route>();
  const { theme } = useAppTheme();

  const roleQuery = useQuery({ queryKey: ['role', params.id], queryFn: () => getRole(params.id) });
  const permsQuery = useQuery({ queryKey: ['role-permissions', params.id], queryFn: () => getRolePermissions(params.id) });

  if (roleQuery.isLoading) return <LoadingState />;
  if (roleQuery.isError || !roleQuery.data) return <ErrorState message="Could not load this role." onRetry={() => roleQuery.refetch()} />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <Text style={[styles.name, { color: theme.text }]}>{roleQuery.data.name}</Text>
          {!!roleQuery.data.description && <Text style={[styles.desc, { color: theme.textMuted }]}>{roleQuery.data.description}</Text>}
        </Card>
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Grants</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {(permsQuery.data ?? []).map((p) => (
              <View key={p.id} style={[styles.chip, { borderColor: theme.border }]}>
                <Text style={[styles.chipText, { color: theme.textMuted }]}>{p.name}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fontFamilies.display, fontSize: 20 },
  desc: { fontFamily: fontFamilies.sans, fontSize: 13, marginTop: 6 },
  sectionTitle: { fontFamily: fontFamilies.sansSemiBold, fontSize: 14 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: fontFamilies.mono, fontSize: 10 },
});
