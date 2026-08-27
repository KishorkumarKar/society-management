import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { getFlat, updateFlat } from '../../api/endpoints/flats';
import { ApiRequestError } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

const schema = z.object({
  block: z.string().min(1, 'Enter a block'),
  floor: z.string().min(1, 'Enter a floor'),
  unitNo: z.string().min(1, 'Enter a unit number'),
  sqft: z.string().min(1, 'Enter the area in sqft'),
  pricePerSqft: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
type Route = RouteProp<AppStackParamList, 'FlatEdit'>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'FlatEdit'>;

export function FlatEditScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();

  const flatQuery = useQuery({ queryKey: ['flat', params.id], queryFn: () => getFlat(params.id) });

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { block: '', floor: '', unitNo: '', sqft: '', pricePerSqft: '' },
    values: flatQuery.data
      ? {
          block: flatQuery.data.block,
          floor: flatQuery.data.floor,
          unitNo: flatQuery.data.unit_no,
          sqft: flatQuery.data.sqft,
          pricePerSqft: flatQuery.data.price_per_sqft ?? '',
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateFlat(params.id, {
        block: values.block,
        floor: values.floor,
        unitNo: values.unitNo,
        sqft: Number(values.sqft),
        pricePerSqft: values.pricePerSqft ? Number(values.pricePerSqft) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flat', params.id] });
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      navigation.goBack();
    },
  });

  if (flatQuery.isLoading) return <LoadingState />;
  if (flatQuery.isError || !flatQuery.data) {
    const { message, requestId } = describeQueryError(flatQuery.error, 'Could not load this flat.');
    return <ErrorState message={message} onRetry={() => flatQuery.refetch()} requestId={requestId} />;
  }

  const serverError = mutation.error instanceof ApiRequestError ? mutation.error.message : null;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.text }]}>Edit flat</Text>

          <View style={{ gap: 16 }}>
            <ControlledField control={control} name="block" label="Block" error={errors.block?.message} />
            <ControlledField control={control} name="floor" label="Floor" error={errors.floor?.message} />
            <ControlledField control={control} name="unitNo" label="Unit number" error={errors.unitNo?.message} />
            <ControlledField control={control} name="sqft" label="Area (sqft)" keyboardType="numeric" error={errors.sqft?.message} />
            <ControlledField control={control} name="pricePerSqft" label="Rate per sqft (optional)" keyboardType="numeric" />
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
  errorBox: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 16 },
});
