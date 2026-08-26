import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { useAuthStore } from '../../store/authStore';

/**
 * Read-only identity + permission summary — sourced entirely from what
 * POST /auth/login already returned (user, society, roles, permissions),
 * no extra network call needed to render this screen.
 */
export function ProfileScreen() {
  const { theme } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const society = useAuthStore((s) => s.society);
  const roles = useAuthStore((s) => s.roles);
  const permissions = useAuthStore((s) => s.permissions);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Card>
          <Text style={[styles.name, { color: theme.text }]}>{user?.name}</Text>
          {user?.email && <Text style={[styles.meta, { color: theme.textMuted }]}>{user.email}</Text>}
          {user?.phone && <Text style={[styles.meta, { color: theme.textMuted }]}>{user.phone}</Text>}
        </Card>

        <View style={{ height: 16 }} />
        <Text style={[styles.sectionLabel, { color: theme.primaryDark }]}>SOCIETY</Text>
        <Card style={{ marginTop: 8 }}>
          <Text style={[styles.name, { color: theme.text }]}>{society?.name}</Text>
          <Text style={[styles.meta, { color: theme.textMuted }]}>{society?.slug}</Text>
        </Card>

        <View style={{ height: 16 }} />
        <Text style={[styles.sectionLabel, { color: theme.primaryDark }]}>ROLES</Text>
        <View style={styles.chipRow}>
          {roles.map((r) => (
            <View key={r} style={[styles.chip, { borderColor: theme.border }]}>
              <Text style={[styles.chipLabel, { color: theme.text }]}>{r}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 16 }} />
        <Text style={[styles.sectionLabel, { color: theme.primaryDark }]}>PERMISSIONS ({permissions.length})</Text>
        <View style={styles.chipRow}>
          {permissions.map((p) => (
            <View key={p} style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.surfaceDim }]}>
              <Text style={[styles.chipLabelMono, { color: theme.textMuted }]}>{p}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fontFamilies.sansSemiBold, fontSize: 17 },
  meta: { fontFamily: fontFamilies.sans, fontSize: 13, marginTop: 2 },
  sectionLabel: { fontFamily: fontFamilies.mono, fontSize: 11, letterSpacing: 1.5 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  chipLabel: { fontFamily: fontFamilies.sansMedium, fontSize: 12 },
  chipLabelMono: { fontFamily: fontFamilies.mono, fontSize: 10 },
});
