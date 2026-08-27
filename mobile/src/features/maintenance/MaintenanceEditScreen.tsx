import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { ControlledField } from '../../components/ui/ControlledField';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { describeQueryError } from '../../lib/describeQueryError';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { getMaintenanceBill, updateMaintenanceBill } from '../../api/endpoints/maintenance';
import { ApiRequestError, MaintenanceBillStatus } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

// updateBillSchema only accepts amount/dueDate/status/penalty — flatId and
// billing period are immutable after creation (backend/src/modules/
// maintenance/maintenance.validators.ts), so this form intentionally has
// no flat picker or year/month fields.
const STATUS_OPTIONS: MaintenanceBillStatus[] = ['due', 'paid', 'overdue', 'approved'];

const schema = z.object({
  amount: z.string().min(1, 'Enter an amount'),
  dueDate: z.string().min(1, 'Enter a due date (YYYY-MM-DD)'),
  penalty: z.string().optional(),
  status: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;
type Route = RouteProp<AppStackParamList, 'MaintenanceEdit'>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'MaintenanceEdit'>;

export function MaintenanceEditScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();

  const billQuery = useQuery({ queryKey: ['maintenance-bill', params.id], queryFn: () => getMaintenanceBill(params.id) });

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', dueDate: '', penalty: '', status: 'due' },
    values: billQuery.data
      ? {
          amount: billQuery.data.amount,
          dueDate: billQuery.data.due_date.slice(0, 10),
          penalty: billQuery.data.penalty,
          status: billQuery.data.status,
        }
      : undefined,
  });
  const status = watch('status');

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateMaintenanceBill(params.id, {
        amount: Number(values.amount),
        dueDate: values.dueDate,
        penalty: values.penalty ? Number(values.penalty) : undefined,
        status: values.status as MaintenanceBillStatus,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-bill', params.id] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      navigation.goBack();
    },
  });

  if (billQuery.isLoading) return <LoadingState />;
  if (billQuery.isError || !billQuery.data) {
    const { message, requestId } = describeQueryError(billQuery.error, 'Could not load this bill.');
    return <ErrorState message={message} onRetry={() => billQuery.refetch()} requestId={requestId} />;
  }

  const serverError = mutation.error instanceof ApiRequestError ? mutation.error.message : null;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.text }]}>Edit bill</Text>

          <View style={{ gap: 16 }}>
            <ControlledField control={control} name="amount" label="Amount" keyboardType="numeric" error={errors.amount?.message} />
            <ControlledField control={control} name="dueDate" label="Due date" placeholder="YYYY-MM-DD" error={errors.dueDate?.message} />
            <ControlledField control={control} name="penalty" label="Penalty" keyboardType="numeric" />

            <View>
              <Text style={[styles.label, { color: theme.textMuted }]}>Status</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {STATUS_OPTIONS.map((opt) => {
                  const active = status === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => setValue('status', opt)}
                      style={[styles.chip, { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : 'transparent' }]}
                    >
                      <Text style={{ color: active ? theme.onPrimary : theme.textMuted, fontFamily: fontFamilies.sansMedium, fontSize: 12 }}>
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {serverError && (
            <View style={[styles.errorBox, { borderColor: theme.danger }]}>
              <Text style={{ color: theme.danger, fontFamily: fontFamilies.sans, fontSize: 13 }}>{serverError}</Text>
            </View>
          )}

          <View style={{ marginTop: 20, flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Button label="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Save changes" onPress={handleSubmit((v) => mutation.mutate(v))} loading={mutation.isPending} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 24, flexGrow: 1 },
  title: { fontFamily: fontFamilies.display, fontSize: 24, marginBottom: 24 },
  label: { fontFamily: fontFamilies.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  errorBox: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 16 },
});
