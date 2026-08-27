import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { describeQueryError } from '../../lib/describeQueryError';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { PermissionGate } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { deleteUser, getUser, getUserPermissions, updateUser } from '../../api/endpoints/users';
import { AppStackParamList } from '../../navigation/types';
import { ApiRequestError } from '../../api/types';

type Route = RouteProp<AppStackParamList, 'UserDetail'>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'UserDetail'>;

export function UserDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();

  const userQuery = useQuery({ queryKey: ['user', params.id], queryFn: () => getUser(params.id) });
  const permsQuery = useQuery({
    queryKey: ['user-permissions', params.id],
    queryFn: () => getUserPermissions(params.id),
    enabled: userQuery.isSuccess,
  });

  const toggleActive = useMutation({
    mutationFn: () => updateUser(params.id, { isActive: !userQuery.data!.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', params.id] }),
  });

  const remove = useMutation({
    mutationFn: () => deleteUser(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigation.goBack();
    },
    onError: (err) => {
      const message = err instanceof ApiRequestError ? err.message : 'Could not delete this user.';
      Alert.alert('Delete failed', message);
    },
  });

  if (userQuery.isLoading) return <LoadingState />;
  if (userQuery.isError || !userQuery.data) {
    const { message, requestId } = describeQueryError(userQuery.error, 'Could not load this resident.');
    return <ErrorState message={message} onRetry={() => userQuery.refetch()} requestId={requestId} />;
  }

  const user = userQuery.data;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
              <Text style={[styles.contact, { color: theme.textMuted }]}>{user.email ?? '—'}</Text>
              <Text style={[styles.contact, { color: theme.textMuted }]}>{user.phone ?? '—'}</Text>
            </View>
            <StatusPill status={user.isActive ? 'active' : 'inactive'} />
          </View>
        </Card>

        <PermissionGate permission={PERMISSIONS.USERS_VIEW}>
          <Card>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Effective permissions</Text>
            {permsQuery.data?.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {permsQuery.data.map((p) => (
                  <View key={p.id} style={[styles.chip, { borderColor: theme.border }]}>
                    <Text style={[styles.chipText, { color: theme.textMuted }]}>{p.name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.contact, { color: theme.textMuted, marginTop: 8 }]}>No permissions assigned.</Text>
            )}
          </Card>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.USERS_UPDATE}>
          <Button
            label="Edit details"
            variant="secondary"
            onPress={() => navigation.navigate('UserEdit', { id: params.id })}
          />
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.USERS_UPDATE}>
          <Button
            label={user.isActive ? 'Deactivate account' : 'Reactivate account'}
            variant="secondary"
            loading={toggleActive.isPending}
            onPress={() => toggleActive.mutate()}
          />
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.USERS_DELETE}>
          <Button
            label="Delete user"
            variant="danger"
            loading={remove.isPending}
            onPress={() =>
              Alert.alert('Delete this user?', 'This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
              ])
            }
          />
        </PermissionGate>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fontFamilies.display, fontSize: 20 },
  contact: { fontFamily: fontFamilies.sans, fontSize: 13, marginTop: 2 },
  sectionTitle: { fontFamily: fontFamilies.sansSemiBold, fontSize: 14 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: fontFamilies.mono, fontSize: 10 },
});
