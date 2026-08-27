import React, { useLayoutEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { EntityListScreen } from '../../components/ui/EntityListScreen';
import { HeaderAddButton } from '../../components/ui/HeaderAddButton';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { useHasPermission } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { listRoles } from '../../api/endpoints/roles';
import { Role } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList, 'Roles'>;

export function RolesListScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const canCreate = useHasPermission(PERMISSIONS.ROLES_CREATE);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: canCreate ? () => <HeaderAddButton onPress={() => navigation.navigate('RoleCreate')} /> : undefined,
    });
  }, [navigation, canCreate]);

  return (
    <Screen>
      <EntityListScreen<Role>
        queryKey="roles"
        fetchPage={(page) => listRoles({ page, limit: 20 })}
        keyExtractor={(r) => String(r.id)}
        emptyTitle="No roles yet"
        renderItem={(r) => (
          <Pressable onPress={() => navigation.navigate('RoleDetail', { id: r.id })}>
            <Card>
              <Text style={[styles.name, { color: theme.text }]}>{r.name}</Text>
              {!!r.description && <Text style={[styles.desc, { color: theme.textMuted }]}>{r.description}</Text>}
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fontFamilies.sansSemiBold, fontSize: 15 },
  desc: { fontFamily: fontFamilies.sans, fontSize: 13, marginTop: 2 },
});
