import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { EntityListScreen } from '../../components/ui/EntityListScreen';
import { HeaderAddButton } from '../../components/ui/HeaderAddButton';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { PermissionGate, useHasPermission } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { decideExpense, listExpenses } from '../../api/endpoints/expenses';
import { Expense, ApiRequestError } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList, 'Expenses'>;

export function ExpensesListScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const canCreate = useHasPermission(PERMISSIONS.EXPENSES_CREATE);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: canCreate ? () => <HeaderAddButton onPress={() => navigation.navigate('ExpenseCreate')} /> : undefined,
    });
  }, [navigation, canCreate]);

  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: 'approved' | 'rejected' }) => decideExpense(id, decision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    onError: (err) => {
      const message = err instanceof ApiRequestError ? err.message : 'Could not update this expense.';
      Alert.alert('Update failed', message);
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
          <Pressable onPress={() => navigation.navigate('ExpenseDetail', { id: e.id })}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.category, { color: theme.text }]}>{e.category}</Text>
                  <Text style={[styles.amount, { color: theme.textMuted }]}>
                    ₹{Number(e.amount).toLocaleString()}{e.vendor_name ? ` · ${e.vendor_name}` : ''}
                  </Text>
                </View>
                <StatusPill status={e.status} />
              </View>
              {e.status === 'pending' && (
                <PermissionGate permission={PERMISSIONS.EXPENSES_APPROVE}>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Approve"
                        variant="secondary"
                        loading={decide.isPending}
                        onPress={() => decide.mutate({ id: e.id, decision: 'approved' })}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Reject"
                        variant="secondary"
                        loading={decide.isPending}
                        onPress={() => decide.mutate({ id: e.id, decision: 'rejected' })}
                      />
                    </View>
                  </View>
                </PermissionGate>
              )}
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  category: { fontFamily: fontFamilies.sansSemiBold, fontSize: 15 },
  amount: { fontFamily: fontFamilies.sans, fontSize: 13, marginTop: 2 },
});
