import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { describeQueryError } from '../../lib/describeQueryError';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { PermissionGate, useHasPermission } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { addRolePermission, deleteRole, getRole, getRolePermissions, removeRolePermission } from '../../api/endpoints/roles';
import { listPermissions } from '../../api/endpoints/permissions';
import { AppStackParamList } from '../../navigation/types';
import { ApiRequestError, Permission } from '../../api/types';

type Route = RouteProp<AppStackParamList, 'RoleDetail'>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'RoleDetail'>;

export function RoleDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const canAssign = useHasPermission(PERMISSIONS.ROLES_ASSIGN_PERMISSION);

  const roleQuery = useQuery({ queryKey: ['role', params.id], queryFn: () => getRole(params.id) });
  const rolePermsQuery = useQuery({ queryKey: ['role-permissions', params.id], queryFn: () => getRolePermissions(params.id) });
  const allPermsQuery = useQuery({ queryKey: ['permissions'], queryFn: () => listPermissions() });

  const grantedIds = new Set((rolePermsQuery.data ?? []).map((p) => p.id));

  const toggle = useMutation({
    mutationFn: ({ permission, grant }: { permission: Permission; grant: boolean }) =>
      grant ? addRolePermission(params.id, permission.id) : removeRolePermission(params.id, permission.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['role-permissions', params.id] }),
    onError: (err) => {
      const message = err instanceof ApiRequestError ? err.message : 'Could not update this grant.';
      Alert.alert('Update failed', message);
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteRole(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      navigation.goBack();
    },
    onError: (err) => {
      const message = err instanceof ApiRequestError ? err.message : 'Could not delete this role.';
      Alert.alert('Delete failed', message);
    },
  });

  if (roleQuery.isLoading) return <LoadingState />;
  if (roleQuery.isError || !roleQuery.data) {
    const { message, requestId } = describeQueryError(roleQuery.error, 'Could not load this role.');
    return <ErrorState message={message} onRetry={() => roleQuery.refetch()} requestId={requestId} />;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <Text style={[styles.name, { color: theme.text }]}>{roleQuery.data.name}</Text>
          {!!roleQuery.data.description && <Text style={[styles.desc, { color: theme.textMuted }]}>{roleQuery.data.description}</Text>}
        </Card>

        <PermissionGate permission={PERMISSIONS.ROLES_UPDATE}>
          <Button label="Edit role" variant="secondary" onPress={() => navigation.navigate('RoleEdit', { id: params.id })} />
        </PermissionGate>

        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Permission grants</Text>
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            {canAssign ? 'Tap a switch to grant or revoke that permission for this role.' : 'What this role currently grants.'}
          </Text>
          <View style={{ marginTop: 12, gap: 2 }}>
            {(allPermsQuery.data ?? []).map((p) => (
              <PermissionRow
                key={p.id}
                permission={p}
                granted={grantedIds.has(p.id)}
                pending={toggle.isPending}
                onToggle={(grant) => toggle.mutate({ permission: p, grant })}
              />
            ))}
          </View>
        </Card>

        <PermissionGate permission={PERMISSIONS.ROLES_DELETE}>
          <Button
            label="Delete role"
            variant="danger"
            loading={remove.isPending}
            onPress={() =>
              Alert.alert('Delete this role?', 'Residents holding this role will lose everything it grants.', [
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

function PermissionRow({
  permission,
  granted,
  pending,
  onToggle,
}: {
  permission: Permission;
  granted: boolean;
  pending: boolean;
  onToggle: (grant: boolean) => void;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.permRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.permName, { color: theme.text }]}>{permission.name}</Text>
        {!!permission.description && (
          <Text style={[styles.permDesc, { color: theme.textMuted }]} numberOfLines={1}>
            {permission.description}
          </Text>
        )}
      </View>
      <PermissionGate
        permission={PERMISSIONS.ROLES_ASSIGN_PERMISSION}
        fallback={<Text style={{ color: granted ? theme.accent : theme.textMuted, fontFamily: fontFamilies.mono, fontSize: 10 }}>{granted ? 'GRANTED' : '—'}</Text>}
      >
        <Switch value={granted} onValueChange={onToggle} disabled={pending} />
      </PermissionGate>
    </View>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fontFamilies.display, fontSize: 20 },
  desc: { fontFamily: fontFamilies.sans, fontSize: 13, marginTop: 6 },
  sectionTitle: { fontFamily: fontFamilies.sansSemiBold, fontSize: 14 },
  hint: { fontFamily: fontFamilies.sans, fontSize: 12, marginTop: 2 },
  permRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  permName: { fontFamily: fontFamilies.mono, fontSize: 12 },
  permDesc: { fontFamily: fontFamilies.sans, fontSize: 11, marginTop: 1 },
});
