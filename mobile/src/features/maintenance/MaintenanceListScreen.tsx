import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { EntityListScreen } from '../../components/ui/EntityListScreen';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { listMaintenanceBills } from '../../api/endpoints/maintenance';
import { MaintenanceBill } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;
const FILTERS: { label: string; value: MaintenanceBill['status'] | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Paid', value: 'paid' },
];

export function MaintenanceListScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const [status, setStatus] = useState<MaintenanceBill['status'] | undefined>(undefined);

  return (
    <Screen>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {FILTERS.map((f) => {
          const active = f.value === status;
          return (
            <Pressable
              key={f.label}
              onPress={() => setStatus(f.value)}
              style={[styles.filterChip, { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : 'transparent' }]}
            >
              <Text style={[styles.filterLabel, { color: active ? theme.onPrimary : theme.textMuted }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <EntityListScreen<MaintenanceBill>
        queryKey={`maintenance:${status ?? 'all'}`}
        fetchPage={(page) => listMaintenanceBills({ page, limit: 20, status })}
        keyExtractor={(b) => String(b.id)}
        emptyTitle="No bills here"
        emptySubtitle="Nothing matches this filter yet."
        renderItem={(bill) => (
          <Pressable onPress={() => navigation.navigate('MaintenanceDetail', { id: bill.id })}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.period, { color: theme.text }]}>{bill.period}</Text>
                  <Text style={[styles.amount, { color: theme.textMuted }]}>
                    ₹{bill.amount_paid.toLocaleString()} of ₹{bill.amount.toLocaleString()} collected
                  </Text>
                </View>
                <StatusPill status={bill.status} />
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: { paddingTop: 12, maxHeight: 44 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  filterLabel: { fontFamily: fontFamilies.sansMedium, fontSize: 12 },
  period: { fontFamily: fontFamilies.sansSemiBold, fontSize: 15 },
  amount: { fontFamily: fontFamilies.sans, fontSize: 13, marginTop: 2 },
});
