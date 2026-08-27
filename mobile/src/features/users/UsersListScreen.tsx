import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { EntityListScreen } from '../../components/ui/EntityListScreen';
import { FAB } from '../../components/ui/FAB';
import { PermissionGate } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { listUsers } from '../../api/endpoints/users';
import { SafeUser } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function UsersListScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const [search, setSearch] = useState('');

  return (
    <Screen>
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search residents…"
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
        />
      </View>
      <EntityListScreen<SafeUser>
        queryKey={`users:${search}`}
        fetchPage={(page) => listUsers({ page, limit: 20, search: search || undefined })}
        keyExtractor={(u) => String(u.id)}
        emptyTitle="No residents found"
        emptySubtitle={search ? `Nothing matches "${search}".` : 'No users have been added to this society yet.'}
        renderItem={(u) => (
          <Pressable onPress={() => navigation.navigate('UserDetail', { id: u.id })}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: theme.text }]}>{u.name}</Text>
                  <Text style={[styles.contact, { color: theme.textMuted }]}>{u.email ?? u.phone}</Text>
                </View>
                <StatusPill status={u.isActive ? 'active' : 'inactive'} />
              </View>
            </Card>
          </Pressable>
        )}
      />
      <PermissionGate permission={PERMISSIONS.USERS_CREATE}>
        <FAB onPress={() => navigation.navigate('UserCreate')} />
      </PermissionGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: { paddingHorizontal: 16, paddingTop: 12 },
  searchInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontFamily: fontFamilies.sans, fontSize: 14 },
  name: { fontFamily: fontFamilies.sansSemiBold, fontSize: 15 },
  contact: { fontFamily: fontFamilies.sans, fontSize: 13, marginTop: 2 },
});
