import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { EntityListScreen } from '../../components/ui/EntityListScreen';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { listFlats } from '../../api/endpoints/flats';
import { Flat } from '../../api/types';

export function FlatsListScreen() {
  const { theme } = useAppTheme();
  return (
    <Screen>
      <EntityListScreen<Flat>
        queryKey="flats"
        fetchPage={(page) => listFlats({ page, limit: 20 })}
        keyExtractor={(f) => String(f.id)}
        emptyTitle="No flats yet"
        emptySubtitle="Units your committee adds will show up here."
        renderItem={(f) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={[styles.unit, { color: theme.text }]}>Unit {f.unit_number}</Text>
                <Text style={[styles.meta, { color: theme.textMuted }]}>
                  {[f.block && `Block ${f.block}`, f.floor != null && `Floor ${f.floor}`].filter(Boolean).join(' · ') || '—'}
                </Text>
              </View>
              <StatusPill status={f.status} />
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  unit: { fontFamily: fontFamilies.sansSemiBold, fontSize: 15 },
  meta: { fontFamily: fontFamilies.sans, fontSize: 12, marginTop: 2 },
});
