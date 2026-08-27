import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { describeQueryError } from '../../lib/describeQueryError';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { PermissionGate } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { deleteMaintenanceBill, getMaintenanceBill, listPayments, recordPayment } from '../../api/endpoints/maintenance';
import { AppStackParamList } from '../../navigation/types';
import { ApiRequestError, PaymentMethod } from '../../api/types';

type Route = RouteProp<AppStackParamList, 'MaintenanceDetail'>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'MaintenanceDetail'>;

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'cheque', 'upi', 'bank_transfer', 'card', 'other'];
const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MaintenanceDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');

  const billQuery = useQuery({ queryKey: ['maintenance-bill', params.id], queryFn: () => getMaintenanceBill(params.id) });
  const paymentsQuery = useQuery({ queryKey: ['maintenance-payments', params.id], queryFn: () => listPayments(params.id) });

  const collect = useMutation({
    mutationFn: () =>
      recordPayment(params.id, {
        amount: Number(amount),
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: method,
      }),
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

  const remove = useMutation({
    mutationFn: () => deleteMaintenanceBill(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      navigation.goBack();
    },
    onError: (err) => {
      const message = err instanceof ApiRequestError ? err.message : 'Could not delete this bill.';
      Alert.alert('Delete failed', message);
    },
  });

  if (billQuery.isLoading) return <LoadingState />;
  if (billQuery.isError || !billQuery.data) {
    const { message, requestId } = describeQueryError(billQuery.error, 'Could not load this bill.');
    return <ErrorState message={message} onRetry={() => billQuery.refetch()} requestId={requestId} />;
  }

  const bill = billQuery.data;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[styles.period, { color: theme.text }]}>{MONTHS[bill.billing_month]} {bill.billing_year}</Text>
            <StatusPill status={bill.status} />
          </View>
          <View style={{ marginTop: 12, gap: 4 }}>
            <Row label="Amount due" value={`₹${Number(bill.amount).toLocaleString()}`} theme={theme} />
            {Number(bill.penalty) > 0 && <Row label="Penalty" value={`₹${Number(bill.penalty).toLocaleString()}`} theme={theme} />}
            <Row label="Collected" value={`₹${bill.totalPaid.toLocaleString()}`} theme={theme} />
            <Row label="Outstanding" value={`₹${bill.outstanding.toLocaleString()}`} theme={theme} strong />
            <Row label="Due date" value={new Date(bill.due_date).toLocaleDateString()} theme={theme} />
          </View>
        </Card>

        <PermissionGate permission={PERMISSIONS.MAINTENANCE_COLLECT}>
          {bill.outstanding > 0 && (
            <Card>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Record a payment</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder={`up to ${bill.outstanding}`}
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
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {PAYMENT_METHODS.map((m) => {
                  const active = method === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setMethod(m)}
                      style={[styles.methodChip, { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : 'transparent' }]}
                    >
                      <Text style={{ color: active ? theme.onPrimary : theme.textMuted, fontFamily: fontFamilies.sansMedium, fontSize: 11 }}>
                        {m.replace('_', ' ')}
                      </Text>
                    </Pressable>
                  );
                })}
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
                  <View>
                    <Text style={[styles.paymentAmount, { color: theme.text }]}>₹{Number(p.amount).toLocaleString()}</Text>
                    <Text style={[styles.paymentDate, { color: theme.textMuted }]}>{p.payment_method.replace('_', ' ')}</Text>
                  </View>
                  <Text style={[styles.paymentDate, { color: theme.textMuted }]}>{new Date(p.payment_date).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.paymentDate, { color: theme.textMuted, marginTop: 8 }]}>No payments recorded yet.</Text>
          )}
        </Card>

        <PermissionGate permission={PERMISSIONS.MAINTENANCE_UPDATE}>
          <Button label="Edit bill" variant="secondary" onPress={() => navigation.navigate('MaintenanceEdit', { id: params.id })} />
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.MAINTENANCE_DELETE}>
          <Button
            label="Delete bill"
            variant="danger"
            loading={remove.isPending}
            onPress={() =>
              Alert.alert('Delete this bill?', 'This cannot be undone.', [
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

function Row({ label, value, theme, strong }: { label: string; value: string; theme: ReturnType<typeof useAppTheme>['theme']; strong?: boolean }) {
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
  methodChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between' },
  paymentAmount: { fontFamily: fontFamilies.sansMedium, fontSize: 14 },
  paymentDate: { fontFamily: fontFamilies.sans, fontSize: 12 },
});
