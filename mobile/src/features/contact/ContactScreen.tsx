import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';

/**
 * Adapted from frontend/app/contact/page.tsx + components/home/ContactForm.tsx.
 *
 * IMPORTANT — this mirrors the web app's actual behavior, not an assumption:
 * the web ContactForm is a static demo (its own comment says so verbatim —
 * "This is a static demo, so nothing was actually sent"). There is no
 * contact/message/inquiry endpoint anywhere in backend/src/modules, so this
 * screen does the same thing: validates locally, then shows a "message
 * received" confirmation without calling any API. If you add a real
 * `POST /contact` (or a third-party form service) to the backend, wire it
 * into `onSubmit` below — the validated `values` object is already shaped
 * for it.
 */
const schema = z.object({
  name: z.string().min(1, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  societyName: z.string().optional(),
  message: z.string().min(1, 'Tell us a little about your society'),
});
type FormValues = z.infer<typeof schema>;

const CONTACT_POINTS = [
  { label: 'Sales & onboarding', value: 'hello@societyledger.test' },
  { label: 'Support desk', value: 'support@societyledger.test' },
  { label: 'Phone', value: '+91 80 4567 1122' },
  { label: 'Office hours', value: 'Mon–Sat, 9 AM – 7 PM IST' },
];

export function ContactScreen() {
  const { theme } = useAppTheme();
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', societyName: '', message: '' },
  });

  const onSubmit = async (values: FormValues) => {
    // Deliberately no API call — see the note above. Matches the source.
    setSubmittedName(values.name);
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={[styles.eyebrow, { color: theme.primaryDark }]}>Notice No. NB-40 · Get in touch</Text>
          <Text style={[styles.title, { color: theme.text }]}>Tell us about your society</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Whether it's one building or a whole federation, we'll help you find the
            right plan and get your committee onboarded.
          </Text>

          <View style={{ gap: 10, marginTop: 20, marginBottom: 24 }}>
            {CONTACT_POINTS.map((point) => (
              <Card key={point.label} style={styles.contactRow}>
                <Text style={[styles.contactLabel, { color: theme.textMuted }]}>{point.label}</Text>
                {point.label === 'Phone' ? (
                  <Pressable onPress={() => Linking.openURL(`tel:${point.value.replace(/\s/g, '')}`)}>
                    <Text style={[styles.contactValue, { color: theme.primaryDark }]}>{point.value}</Text>
                  </Pressable>
                ) : point.label.includes('email') || point.value.includes('@') ? (
                  <Pressable onPress={() => Linking.openURL(`mailto:${point.value}`)}>
                    <Text style={[styles.contactValue, { color: theme.primaryDark }]}>{point.value}</Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.contactValue, { color: theme.text }]}>{point.value}</Text>
                )}
              </Card>
            ))}
          </View>

          <Card>
            {submittedName ? (
              <View style={{ gap: 6 }}>
                <Text style={[styles.confirmTitle, { color: theme.text }]}>
                  Message received, {submittedName.split(' ')[0] || 'there'}.
                </Text>
                <Text style={[styles.confirmBody, { color: theme.textMuted }]}>
                  This is a demo form, so nothing was actually sent anywhere — but in
                  the live product, your committee's inbox would have this in front of
                  them right now.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                <Field control={control} name="name" label="Full name" error={errors.name?.message} />
                <Field control={control} name="email" label="Email" keyboardType="email-address" autoCapitalize="none" error={errors.email?.message} />
                <Field control={control} name="societyName" label="Society name (optional)" />
                <Field control={control} name="message" label="Message" multiline numberOfLines={4} error={errors.message?.message} />
                <Button label="Send message" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
              </View>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({ control, name, label, error, multiline, ...rest }: any) {
  const { theme } = useAppTheme();
  return (
    <View>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              styles.input,
              multiline && styles.inputMultiline,
              { borderColor: error ? theme.danger : theme.border, color: theme.text, backgroundColor: theme.surface },
            ]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholderTextColor={theme.textMuted}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
            {...rest}
          />
        )}
      />
      {error && <Text style={[styles.fieldError, { color: theme.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fontFamilies.mono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { fontFamily: fontFamilies.display, fontSize: 26, marginTop: 6 },
  subtitle: { fontFamily: fontFamilies.sans, fontSize: 14, lineHeight: 20, marginTop: 8 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactLabel: { fontFamily: fontFamilies.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  contactValue: { fontFamily: fontFamilies.sans, fontSize: 13 },
  fieldLabel: { fontFamily: fontFamilies.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fontFamilies.sans, fontSize: 15 },
  inputMultiline: { minHeight: 100, paddingTop: 12 },
  fieldError: { fontFamily: fontFamilies.sans, fontSize: 12, marginTop: 4 },
  confirmTitle: { fontFamily: fontFamilies.display, fontSize: 18 },
  confirmBody: { fontFamily: fontFamilies.sans, fontSize: 13, lineHeight: 19 },
});
