import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { describeQueryError } from '../../lib/describeQueryError';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { PermissionGate } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { decideExpense, deleteExpense, getExpense } from '../../api/endpoints/expenses';
import { AppStackParamList } from '../../navigation/types';
import { ApiRequestError } from '../../api/types';

type Route = RouteProp<AppStackParamList, 'ExpenseDetail'>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'ExpenseDetail'>;

export function ExpenseDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['expense', params.id], queryFn: () => getExpense(params.id) });

  const decide = useMutation({
    mutationFn: (decision: 'approved' | 'rejected') => decideExpense(params.id, decision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expense', params.id] }),
    onError: (err) => {
      const message = err instanceof ApiRequestError ? err.message : 'Could not update this expense.';
      Alert.alert('Update failed', message);
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteExpense(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      navigation.goBack();
    },
    onError: (err) => {
      const message = err instanceof ApiRequestError ? err.message : 'Could not delete this expense.';
      Alert.alert('Delete failed', message);
    },
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) {
    const { message, requestId } = describeQueryError(query.error, 'Could not load this expense.');
    return <ErrorState message={message} onRetry={() => query.refetch()} requestId={requestId} />;
  }

  const e = query.data;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[styles.category, { color: theme.text }]}>{e.category}</Text>
            <StatusPill status={e.status} />
          </View>
          <View style={{ marginTop: 12, gap: 4 }}>
            <Row label="Amount" value={`₹${Number(e.amount).toLocaleString()}`} theme={theme} strong />
            <Row label="Date" value={new Date(e.expense_date).toLocaleDateString()} theme={theme} />
            {e.vendor_name && <Row label="Vendor" value={e.vendor_name} theme={theme} />}
            {e.approved_by && <Row label="Decided by" value={`User #${e.approved_by}`} theme={theme} />}
          </View>
          {!!e.description && <Text style={[styles.description, { color: theme.textMuted }]}>{e.description}</Text>}
        </Card>

        {e.status === 'pending' && (
          <PermissionGate permission={PERMISSIONS.EXPENSES_APPROVE}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Button label="Approve" loading={decide.isPending} onPress={() => decide.mutate('approved')} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Reject" variant="secondary" loading={decide.isPending} onPress={() => decide.mutate('rejected')} />
              </View>
            </View>
          </PermissionGate>
        )}

        <PermissionGate permission={PERMISSIONS.EXPENSES_UPDATE}>
          <Button label="Edit expense" variant="secondary" onPress={() => navigation.navigate('ExpenseEdit', { id: params.id })} />
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.EXPENSES_DELETE}>
          <Button
            label="Delete expense"
            variant="danger"
            loading={remove.isPending}
            onPress={() =>
              Alert.alert('Delete this expense?', 'This cannot be undone.', [
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
  category: { fontFamily: fontFamilies.display, fontSize: 20, flex: 1, marginRight: 12 },
  description: { fontFamily: fontFamilies.sans, fontSize: 13, lineHeight: 19, marginTop: 12 },
  rowLabel: { fontFamily: fontFamilies.sans, fontSize: 13 },
  rowValue: { fontFamily: fontFamilies.sans, fontSize: 13 },
  rowValueStrong: { fontFamily: fontFamilies.sansSemiBold, fontSize: 13 },
});
