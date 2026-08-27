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
import { createUser } from '../../api/endpoints/users';
import { ApiRequestError } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

// Matches CreateUserPayload in api/endpoints/users.ts exactly (name +
// email-or-phone + password) — the backend requires at least one of
// email/phone, same as login's identifier.
const schema = z
  .object({
    name: z.string().min(1, 'Enter a full name'),
    identifier: z.string().min(1, 'Enter an email or phone'),
    password: z.string().min(8, 'At least 8 characters'),
  })
  .transform((v) => ({
    name: v.name.trim(),
    password: v.password,
    ...(v.identifier.includes('@') ? { email: v.identifier.trim() } : { phone: v.identifier.trim() }),
  }));

type FormValues = { name: string; identifier: string; password: string };
type Nav = NativeStackNavigationProp<AppStackParamList, 'UserCreate'>;

export function UserCreateScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { name: '', identifier: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: any) => createUser(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigation.goBack();
    },
  });

  const serverError = mutation.error instanceof ApiRequestError ? mutation.error.message : null;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.text }]}>Add a resident</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            They'll be able to sign in with this email or phone and password.
          </Text>

          <View style={{ gap: 16 }}>
            <ControlledField control={control} name="name" label="Full name" error={errors.name?.message} />
            <ControlledField
              control={control}
              name="identifier"
              label="Email or phone"
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.identifier?.message}
            />
            <ControlledField
              control={control}
              name="password"
              label="Temporary password"
              secureTextEntry
              error={errors.password?.message}
            />
          </View>

          {serverError && (
            <View style={[styles.errorBox, { borderColor: theme.danger }]}>
              <Text style={{ color: theme.danger, fontFamily: fontFamilies.sans, fontSize: 13 }}>{serverError}</Text>
            </View>
          )}

          <View style={{ marginTop: 20 }}>
            <Button label="Add resident" onPress={handleSubmit((v) => mutation.mutate(v))} loading={mutation.isPending} />
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
