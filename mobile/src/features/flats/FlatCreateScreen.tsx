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
import { createFlat } from '../../api/endpoints/flats';
import { ApiRequestError } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

// Matches createFlatSchema exactly (backend/src/modules/flats/flats.validators.ts):
// block/floor/unitNo required strings, sqft required number, owner/pricing optional.
const schema = z.object({
  block: z.string().min(1, 'Enter a block'),
  floor: z.string().min(1, 'Enter a floor'),
  unitNo: z.string().min(1, 'Enter a unit number'),
  sqft: z.string().min(1, 'Enter the area in sqft'),
  pricePerSqft: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'FlatCreate'>;

export function FlatCreateScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { block: '', floor: '', unitNo: '', sqft: '', pricePerSqft: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createFlat({
        block: values.block,
        floor: values.floor,
        unitNo: values.unitNo,
        sqft: Number(values.sqft),
        pricePerSqft: values.pricePerSqft ? Number(values.pricePerSqft) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      navigation.goBack();
    },
  });

  const serverError = mutation.error instanceof ApiRequestError ? mutation.error.message : null;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.text }]}>Add a flat</Text>

          <View style={{ gap: 16 }}>
            <ControlledField control={control} name="block" label="Block" placeholder="e.g. A" error={errors.block?.message} />
            <ControlledField control={control} name="floor" label="Floor" placeholder="e.g. 2" error={errors.floor?.message} />
            <ControlledField control={control} name="unitNo" label="Unit number" placeholder="e.g. 204" error={errors.unitNo?.message} />
            <ControlledField control={control} name="sqft" label="Area (sqft)" keyboardType="numeric" error={errors.sqft?.message} />
            <ControlledField control={control} name="pricePerSqft" label="Rate per sqft (optional)" keyboardType="numeric" />
          </View>

          {serverError && (
            <View style={[styles.errorBox, { borderColor: theme.danger }]}>
              <Text style={{ color: theme.danger, fontFamily: fontFamilies.sans, fontSize: 13 }}>{serverError}</Text>
            </View>
          )}

          <View style={{ marginTop: 20 }}>
            <Button label="Add flat" onPress={handleSubmit((v) => mutation.mutate(v))} loading={mutation.isPending} />
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
