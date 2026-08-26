import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { useAuthStore } from '../../store/authStore';
import { PermissionGate } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { AppStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

/**
 * Catch-all for everything that doesn't fit the 5-icon tab bar: modules
 * gated behind their own permission (Flats, Expenses, Roles, Permissions,
 * Societies, Notifications), plus account actions. Every row here is
 * PermissionGate-wrapped — a resident with no admin permissions sees a
 * short, honest list, not a wall of disabled buttons.
 */
export function MoreScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const confirmLogout = () => {
    Alert.alert('Sign out', 'You will need to sign in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Modules</Text>
        <PermissionGate permission={PERMISSIONS.FLATS_VIEW}>
          <Row icon="business-outline" label="Flats" onPress={() => navigation.navigate('Flats')} />
        </PermissionGate>
        <PermissionGate permission={PERMISSIONS.EXPENSES_VIEW}>
          <Row icon="wallet-outline" label="Expenses" onPress={() => navigation.navigate('Expenses')} />
        </PermissionGate>
        <PermissionGate permission={PERMISSIONS.NOTIFICATIONS_VIEW}>
          <Row icon="notifications-outline" label="Notifications" onPress={() => navigation.navigate('Notifications')} />
        </PermissionGate>

        <View style={{ height: 20 }} />
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Administration</Text>
        <PermissionGate permission={PERMISSIONS.ROLES_VIEW}>
          <Row icon="shield-checkmark-outline" label="Roles" onPress={() => navigation.navigate('Roles')} />
        </PermissionGate>
        <PermissionGate permission={PERMISSIONS.PERMISSIONS_VIEW}>
          <Row icon="key-outline" label="Permissions" onPress={() => navigation.navigate('Permissions')} />
        </PermissionGate>
        <PermissionGate permission={PERMISSIONS.SOCIETIES_VIEW}>
          <Row icon="globe-outline" label="Societies" onPress={() => navigation.navigate('Societies')} />
        </PermissionGate>

        <View style={{ height: 20 }} />
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>About</Text>
        <Row icon="information-circle-outline" label="About us" onPress={() => navigation.navigate('About')} />
        <Row icon="mail-outline" label="Contact us" onPress={() => navigation.navigate('Contact')} />
        <Row icon="document-text-outline" label="Terms & Conditions" onPress={() => navigation.navigate('Terms')} />

        <View style={{ height: 20 }} />
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Account</Text>
        <Row icon="person-outline" label={user?.name ?? 'Profile'} onPress={() => navigation.navigate('Profile')} />
        <Row icon="log-out-outline" label="Sign out" onPress={confirmLogout} destructive />
      </ScrollView>
    </Screen>
  );
}

function Row({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { theme } = useAppTheme();
  const color = destructive ? theme.danger : theme.text;
  return (
    <Pressable onPress={onPress} style={[styles.row, { borderColor: theme.border }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      {!destructive && <Ionicons name="chevron-forward" size={16} color={theme.textMuted} style={{ marginLeft: 'auto' }} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontFamily: fontFamilies.mono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  rowLabel: { fontFamily: fontFamilies.sansMedium, fontSize: 15 },
});
