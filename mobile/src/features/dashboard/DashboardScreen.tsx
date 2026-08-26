import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { useAuthStore } from '../../store/authStore';
import { PermissionGate } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { AppStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

const QUICK_LINKS: {
  key: keyof AppStackParamList;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  permission: string;
}[] = [
  { key: 'Roles', label: 'Roles', icon: 'shield-checkmark-outline', permission: PERMISSIONS.ROLES_VIEW },
  { key: 'Permissions', label: 'Permissions', icon: 'key-outline', permission: PERMISSIONS.PERMISSIONS_VIEW },
  { key: 'Societies', label: 'Societies', icon: 'globe-outline', permission: PERMISSIONS.SOCIETIES_VIEW },
];

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const society = useAuthStore((s) => s.society);
  const roles = useAuthStore((s) => s.roles);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={[styles.eyebrow, { color: theme.primaryDark }]}>{society?.name ?? 'Your society'}</Text>
        <Text style={[styles.title, { color: theme.text }]}>Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</Text>
        {roles.length > 0 && (
          <Text style={[styles.roleLine, { color: theme.textMuted }]}>{roles.join(' · ')}</Text>
        )}

        <View style={{ height: 24 }} />

        <PermissionGate permission={PERMISSIONS.FLATS_VIEW}>
          <QuickCard
            icon="business-outline"
            title="Flats"
            body="Browse units and their occupancy status."
            onPress={() => navigation.navigate('Flats')}
          />
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.EXPENSES_VIEW}>
          <QuickCard
            icon="wallet-outline"
            title="Expenses"
            body="Society spending, pending approvals included."
            onPress={() => navigation.navigate('Expenses')}
          />
        </PermissionGate>

        <View style={{ height: 8 }} />
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Administration</Text>
        <View style={styles.grid}>
          {QUICK_LINKS.map((link) => (
            <PermissionGate key={link.key} permission={link.permission as any}>
              <Pressable
                onPress={() => navigation.navigate(link.key as any)}
                style={[styles.gridItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Ionicons name={link.icon} size={20} color={theme.primaryDark} />
                <Text style={[styles.gridLabel, { color: theme.text }]}>{link.label}</Text>
              </Pressable>
            </PermissionGate>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function QuickCard({ icon, title, body, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; onPress: () => void }) {
  const { theme } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={{ marginBottom: 12 }}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={[styles.iconWrap, { backgroundColor: theme.surfaceDim }]}>
            <Ionicons name={icon} size={20} color={theme.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.cardBody, { color: theme.textMuted }]}>{body}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fontFamilies.mono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { fontFamily: fontFamilies.display, fontSize: 26, marginTop: 6 },
  roleLine: { fontFamily: fontFamilies.sans, fontSize: 13, marginTop: 4 },
  sectionLabel: { fontFamily: fontFamilies.mono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: fontFamilies.sansSemiBold, fontSize: 15 },
  cardBody: { fontFamily: fontFamilies.sans, fontSize: 12, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '31%', aspectRatio: 1, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  gridLabel: { fontFamily: fontFamilies.sansMedium, fontSize: 12, textAlign: 'center' },
});
