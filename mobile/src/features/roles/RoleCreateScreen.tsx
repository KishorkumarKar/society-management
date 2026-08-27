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
import { createRole } from '../../api/endpoints/roles';
import { ApiRequestError } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

const schema = z.object({
  name: z.string().min(1, 'Enter a role name'),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'RoleCreate'>;

export function RoleCreateScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => createRole({ name: values.name, description: values.description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      navigation.goBack();
    },
  });

  const serverError = mutation.error instanceof ApiRequestError ? mutation.error.message : null;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.text }]}>New role</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            You can attach permissions to it right after creating it.
          </Text>

          <View style={{ gap: 16 }}>
            <ControlledField control={control} name="name" label="Role name" placeholder="e.g. Treasurer" error={errors.name?.message} />
            <ControlledField control={control} name="description" label="Description (optional)" multiline numberOfLines={3} />
          </View>

          {serverError && (
            <View style={[styles.errorBox, { borderColor: theme.danger }]}>
              <Text style={{ color: theme.danger, fontFamily: fontFamilies.sans, fontSize: 13 }}>{serverError}</Text>
            </View>
          )}

          <View style={{ marginTop: 20 }}>
            <Button label="Create role" onPress={handleSubmit((v) => mutation.mutate(v))} loading={mutation.isPending} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 24, flexGrow: 1 },
  title: { fontFamily: fontFamilies.display, fontSize: 24 },
  subtitle: { fontFamily: fontFamilies.sans, fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 24 },
  errorBox: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 16 },
});
