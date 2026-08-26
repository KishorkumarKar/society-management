import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { EntityListScreen } from '../../components/ui/EntityListScreen';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { PermissionGate } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { approveExpense, listExpenses } from '../../api/endpoints/expenses';
import { Expense, ApiRequestError } from '../../api/types';

export function ExpensesListScreen() {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();

  const approve = useMutation({
    mutationFn: (id: number) => approveExpense(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    onError: (err) => {
      const message = err instanceof ApiRequestError ? err.message : 'Could not approve this expense.';
      Alert.alert('Approval failed', message);
    },
  });

  return (
    <Screen>
      <EntityListScreen<Expense>
        queryKey="expenses"
        fetchPage={(page) => listExpenses({ page, limit: 20 })}
        keyExtractor={(e) => String(e.id)}
        emptyTitle="No expenses recorded"
        renderItem={(e) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.category, { color: theme.text }]}>{e.category}</Text>
                <Text style={[styles.amount, { color: theme.textMuted }]}>₹{e.amount.toLocaleString()}</Text>
              </View>
              <StatusPill status={e.status} />
            </View>
            {e.status === 'pending' && (
              <PermissionGate permission={PERMISSIONS.EXPENSES_APPROVE}>
                <View style={{ marginTop: 12 }}>
                  <Button label="Approve" variant="secondary" loading={approve.isPending} onPress={() => approve.mutate(e.id)} />
                </View>
              </PermissionGate>
            )}
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  category: { fontFamily: fontFamilies.sansSemiBold, fontSize: 15 },
  amount: { fontFamily: fontFamilies.sans, fontSize: 13, marginTop: 2 },
});
