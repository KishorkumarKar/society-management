import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { EntityListScreen } from '../../components/ui/EntityListScreen';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { listSocieties } from '../../api/endpoints/societies';
import { Society } from '../../api/types';

/**
 * Platform-level administration: only users holding societies.view (almost
 * never a regular committee member) ever land here — see the Dashboard
 * quick-link, which is itself PermissionGate-wrapped on the same permission.
 */
export function SocietiesListScreen() {
  const { theme } = useAppTheme();
  return (
    <Screen>
      <EntityListScreen<Society>
        queryKey="societies"
        fetchPage={(page) => listSocieties({ page, limit: 20 })}
        keyExtractor={(s) => String(s.id)}
        emptyTitle="No societies yet"
        renderItem={(s) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={[styles.name, { color: theme.text }]}>{s.name}</Text>
                <Text style={[styles.meta, { color: theme.textMuted }]}>{s.slug}</Text>
              </View>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fontFamilies.sansSemiBold, fontSize: 15 },
  meta: { fontFamily: fontFamilies.mono, fontSize: 11, marginTop: 2 },
});
