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
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { createExpense } from '../../api/endpoints/expenses';
import { ApiRequestError } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

const schema = z.object({
  category: z.string().min(1, 'Enter a category'),
  amount: z.string().min(1, 'Enter an amount'),
  expenseDate: z.string().min(1, 'Enter a date (YYYY-MM-DD)'),
  vendorName: z.string().optional(),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'ExpenseCreate'>;

export function ExpenseCreateScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: '', amount: '', expenseDate: today, vendorName: '', description: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createExpense({
        category: values.category,
        amount: Number(values.amount),
        expenseDate: values.expenseDate,
        vendorName: values.vendorName || undefined,
        description: values.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      navigation.goBack();
    },
  });

  const serverError = mutation.error instanceof ApiRequestError ? mutation.error.message : null;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.text }]}>Record an expense</Text>

          <View style={{ gap: 16 }}>
            <ControlledField control={control} name="category" label="Category" placeholder="e.g. Plumbing" error={errors.category?.message} />
            <ControlledField control={control} name="amount" label="Amount" keyboardType="numeric" error={errors.amount?.message} />
            <ControlledField
              control={control}
              name="expenseDate"
              label="Date"
              placeholder="YYYY-MM-DD"
              error={errors.expenseDate?.message}
            />
            <ControlledField control={control} name="vendorName" label="Vendor (optional)" />
            <ControlledField control={control} name="description" label="Description (optional)" multiline numberOfLines={3} />
          </View>

          {serverError && (
            <View style={[styles.errorBox, { borderColor: theme.danger }]}>
              <Text style={{ color: theme.danger, fontFamily: fontFamilies.sans, fontSize: 13 }}>{serverError}</Text>
            </View>
          )}

          <View style={{ marginTop: 20 }}>
            <Button label="Record expense" onPress={handleSubmit((v) => mutation.mutate(v))} loading={mutation.isPending} />
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
