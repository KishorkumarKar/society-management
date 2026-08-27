import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { ControlledField } from '../../components/ui/ControlledField';
import { FlatPicker } from '../../components/ui/FlatPicker';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { createMaintenanceBill } from '../../api/endpoints/maintenance';
import { ApiRequestError, Flat } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

const now = new Date();

const schema = z.object({
  billingYear: z.string().min(1, 'Enter a year'),
  billingMonth: z.string().min(1, 'Enter a month (1-12)'),
  amount: z.string().min(1, 'Enter an amount'),
  dueDate: z.string().min(1, 'Enter a due date (YYYY-MM-DD)'),
  penalty: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'MaintenanceCreate'>;

export function MaintenanceCreateScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const [flat, setFlat] = React.useState<Flat | null>(null);
  const [flatError, setFlatError] = React.useState<string | undefined>();

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      billingYear: String(now.getFullYear()),
      billingMonth: String(now.getMonth() + 1),
      amount: '',
      dueDate: '',
      penalty: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createMaintenanceBill({
        flatId: flat!.id,
        billingYear: Number(values.billingYear),
        billingMonth: Number(values.billingMonth),
        amount: Number(values.amount),
        dueDate: values.dueDate,
        penalty: values.penalty ? Number(values.penalty) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      navigation.goBack();
    },
  });

  const serverError = mutation.error instanceof ApiRequestError ? mutation.error.message : null;

  const onSubmit = handleSubmit((values) => {
    if (!flat) {
      setFlatError('Select a flat');
      return;
    }
    setFlatError(undefined);
    mutation.mutate(values);
  });

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.text }]}>New maintenance bill</Text>

          <View style={{ gap: 16 }}>
            <FlatPicker value={flat} onChange={setFlat} error={flatError} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <ControlledField control={control} name="billingYear" label="Year" keyboardType="numeric" error={errors.billingYear?.message} />
              </View>
              <View style={{ flex: 1 }}>
                <ControlledField control={control} name="billingMonth" label="Month (1-12)" keyboardType="numeric" error={errors.billingMonth?.message} />
              </View>
            </View>
            <ControlledField control={control} name="amount" label="Amount" keyboardType="numeric" error={errors.amount?.message} />
            <ControlledField control={control} name="dueDate" label="Due date" placeholder="YYYY-MM-DD" error={errors.dueDate?.message} />
            <ControlledField control={control} name="penalty" label="Penalty (optional)" keyboardType="numeric" />
          </View>

          {serverError && (
            <View style={[styles.errorBox, { borderColor: theme.danger }]}>
              <Text style={{ color: theme.danger, fontFamily: fontFamilies.sans, fontSize: 13 }}>{serverError}</Text>
            </View>
          )}

          <View style={{ marginTop: 20 }}>
            <Button label="Create bill" onPress={onSubmit} loading={mutation.isPending} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 24, flexGrow: 1 },
  title: { fontFamily: fontFamilies.display, fontSize: 24, marginBottom: 24 },
  errorBox: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 16 },
});
