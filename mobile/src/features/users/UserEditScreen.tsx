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
import { getUser, updateUser } from '../../api/endpoints/users';
import { ApiRequestError } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

const schema = z.object({
  name: z.string().min(1, 'Enter a full name'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;
type Route = RouteProp<AppStackParamList, 'UserEdit'>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'UserEdit'>;

export function UserEditScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();

  const userQuery = useQuery({ queryKey: ['user', params.id], queryFn: () => getUser(params.id) });

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '' },
    values: userQuery.data
      ? { name: userQuery.data.name, email: userQuery.data.email ?? '', phone: userQuery.data.phone ?? '' }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      updateUser(params.id, { name: values.name, email: values.email || undefined, phone: values.phone || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', params.id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigation.goBack();
    },
  });

  if (userQuery.isLoading) return <LoadingState />;
  if (userQuery.isError || !userQuery.data) {
    const { message, requestId } = describeQueryError(userQuery.error, 'Could not load this resident.');
    return <ErrorState message={message} onRetry={() => userQuery.refetch()} requestId={requestId} />;
  }

  const serverError = mutation.error instanceof ApiRequestError ? mutation.error.message : null;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.text }]}>Edit resident</Text>

          <View style={{ gap: 16 }}>
            <ControlledField control={control} name="name" label="Full name" error={errors.name?.message} />
            <ControlledField
              control={control}
              name="email"
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email?.message}
            />
            <ControlledField control={control} name="phone" label="Phone" keyboardType="phone-pad" error={errors.phone?.message} />
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
