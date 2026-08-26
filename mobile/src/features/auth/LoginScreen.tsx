import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { useAuthStore } from '../../store/authStore';
import { ApiRequestError } from '../../api/types';

// Login is society slug + (email OR phone) + password — matches
// backend/src/modules/auth/auth.validators.ts / auth.service.ts exactly.
// The generic "Invalid credentials" error the backend returns for a wrong
// society, wrong user, or wrong password alike is shown as-is: the backend
// deliberately never reveals which piece was wrong, and the client
// shouldn't second-guess that by inventing a more specific message.
const schema = z
  .object({
    society: z.string().min(1, 'Enter your society code'),
    identifier: z.string().min(1, 'Enter your email or phone'),
    password: z.string().min(1, 'Enter your password'),
  })
  .transform((v) => ({
    society: v.society.trim().toLowerCase(),
    password: v.password,
    ...(v.identifier.includes('@') ? { email: v.identifier.trim() } : { phone: v.identifier.trim() }),
  }));

type FormValues = { society: string; identifier: string; password: string };

export function LoginScreen() {
  const navigation = useNavigation();
  const { theme } = useAppTheme();
  const login = useAuthStore((s) => s.login);
  const isSubmitting = useAuthStore((s) => s.isSubmitting);
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { society: '', identifier: '', password: '' },
  });

  const onSubmit = async (values: any) => {
    setFormError(null);
    try {
      await login(values);
      // No manual navigation on success: RootNavigator watches auth
      // status and swaps to AppStack itself once state flips to signedIn.
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFormError(err.message);
      } else {
        setFormError('Unable to sign in. Check your connection and try again.');
      }
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => navigation.goBack()} style={{ alignSelf: 'flex-start', marginBottom: 24 }}>
            <Text style={{ color: theme.textMuted, fontFamily: fontFamilies.sansMedium }}>← Back</Text>
          </Pressable>

          <Text style={[styles.title, { color: theme.text }]}>Sign in</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Enter your society code and the email or phone your committee registered for you.
          </Text>

          <Field
            control={control}
            name="society"
            label="Society code"
            placeholder="e.g. green-valley"
            autoCapitalize="none"
            error={errors.society?.message}
          />
          <Field
            control={control}
            name="identifier"
            label="Email or phone"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            error={errors.identifier?.message}
          />
          <Field
            control={control}
            name="password"
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            error={errors.password?.message}
          />

          {formError && (
            <View style={[styles.errorBox, { borderColor: theme.danger }]}>
              <Text style={{ color: theme.danger, fontFamily: fontFamilies.sans, fontSize: 13 }}>{formError}</Text>
            </View>
          )}

          <View style={{ marginTop: 12 }}>
            <Button label="Sign in" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({ control, name, label, error, ...rest }: any) {
  const { theme } = useAppTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, { borderColor: error ? theme.danger : theme.border, color: theme.text, backgroundColor: theme.surface }]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholderTextColor={theme.textMuted}
            {...rest}
          />
        )}
      />
      {error && <Text style={[styles.fieldError, { color: theme.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 32, flexGrow: 1 },
  title: { fontFamily: fontFamilies.display, fontSize: 26 },
  subtitle: { fontFamily: fontFamilies.sans, fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 28 },
  fieldLabel: { fontFamily: fontFamilies.mono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fontFamilies.sans, fontSize: 15 },
  fieldError: { fontFamily: fontFamilies.sans, fontSize: 12, marginTop: 4 },
  errorBox: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 },
});
