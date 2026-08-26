import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { PermissionGate } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { getMaintenanceBill, listPayments, recordPayment } from '../../api/endpoints/maintenance';
import { AppStackParamList } from '../../navigation/types';
import { ApiRequestError } from '../../api/types';

type Route = RouteProp<AppStackParamList, 'MaintenanceDetail'>;

export function MaintenanceDetailScreen() {
  const { params } = useRoute<Route>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');

  const billQuery = useQuery({ queryKey: ['maintenance-bill', params.id], queryFn: () => getMaintenanceBill(params.id) });
  const paymentsQuery = useQuery({ queryKey: ['maintenance-payments', params.id], queryFn: () => listPayments(params.id) });

  const collect = useMutation({
    mutationFn: () => recordPayment(params.id, { amount: Number(amount) }),
    onSuccess: () => {
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['maintenance-bill', params.id] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-payments', params.id] });
    },
    onError: (err) => {
      const message = err instanceof ApiRequestError ? err.message : 'Could not record this payment.';
      Alert.alert('Payment failed', message);
    },
  });

  if (billQuery.isLoading) return <LoadingState />;
  if (billQuery.isError || !billQuery.data) {
    return <ErrorState message="Could not load this bill." onRetry={() => billQuery.refetch()} />;
  }

  const bill = billQuery.data;
  const remaining = bill.amount - bill.amount_paid;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[styles.period, { color: theme.text }]}>{bill.period}</Text>
            <StatusPill status={bill.status} />
          </View>
          <View style={{ marginTop: 12, gap: 4 }}>
            <Row label="Amount due" value={`₹${bill.amount.toLocaleString()}`} theme={theme} />
            <Row label="Collected" value={`₹${bill.amount_paid.toLocaleString()}`} theme={theme} />
            <Row label="Remaining" value={`₹${remaining.toLocaleString()}`} theme={theme} strong />
            <Row label="Due date" value={new Date(bill.due_date).toLocaleDateString()} theme={theme} />
          </View>
        </Card>

        <PermissionGate permission={PERMISSIONS.MAINTENANCE_COLLECT}>
          {remaining > 0 && (
            <Card>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Record a payment</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder={`up to ${remaining}`}
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                />
                <View style={{ width: 120 }}>
                  <Button
                    label="Collect"
                    loading={collect.isPending}
                    disabled={!amount || Number(amount) <= 0}
                    onPress={() => collect.mutate()}
                  />
                </View>
              </View>
            </Card>
          )}
        </PermissionGate>

        <Card>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Payment history</Text>
          {paymentsQuery.data?.length ? (
            <View style={{ marginTop: 10, gap: 10 }}>
              {paymentsQuery.data.map((p) => (
                <View key={p.id} style={styles.paymentRow}>
                  <Text style={[styles.paymentAmount, { color: theme.text }]}>₹{p.amount.toLocaleString()}</Text>
                  <Text style={[styles.paymentDate, { color: theme.textMuted }]}>{new Date(p.paid_at).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.paymentDate, { color: theme.textMuted, marginTop: 8 }]}>No payments recorded yet.</Text>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value, theme, strong }: { label: string; value: string; theme: any; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[styles.rowLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[strong ? styles.rowValueStrong : styles.rowValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  period: { fontFamily: fontFamilies.display, fontSize: 20 },
  sectionTitle: { fontFamily: fontFamilies.sansSemiBold, fontSize: 14 },
  rowLabel: { fontFamily: fontFamilies.sans, fontSize: 13 },
  rowValue: { fontFamily: fontFamilies.sans, fontSize: 13 },
  rowValueStrong: { fontFamily: fontFamilies.sansSemiBold, fontSize: 13 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontFamily: fontFamilies.sans, fontSize: 14 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between' },
  paymentAmount: { fontFamily: fontFamilies.sansMedium, fontSize: 14 },
  paymentDate: { fontFamily: fontFamilies.sans, fontSize: 12 },
});
