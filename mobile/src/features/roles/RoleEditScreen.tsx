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
import { getRole, updateRole } from '../../api/endpoints/roles';
import { ApiRequestError } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

const schema = z.object({
  name: z.string().min(1, 'Enter a role name'),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
type Route = RouteProp<AppStackParamList, 'RoleEdit'>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'RoleEdit'>;

export function RoleEditScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();

  const roleQuery = useQuery({ queryKey: ['role', params.id], queryFn: () => getRole(params.id) });

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
    values: roleQuery.data ? { name: roleQuery.data.name, description: roleQuery.data.description ?? '' } : undefined,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => updateRole(params.id, { name: values.name, description: values.description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role', params.id] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      navigation.goBack();
    },
  });

  if (roleQuery.isLoading) return <LoadingState />;
  if (roleQuery.isError || !roleQuery.data) {
    const { message, requestId } = describeQueryError(roleQuery.error, 'Could not load this role.');
    return <ErrorState message={message} onRetry={() => roleQuery.refetch()} requestId={requestId} />;
  }

  const serverError = mutation.error instanceof ApiRequestError ? mutation.error.message : null;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.text }]}>Edit role</Text>

          <View style={{ gap: 16 }}>
            <ControlledField control={control} name="name" label="Role name" error={errors.name?.message} />
            <ControlledField control={control} name="description" label="Description (optional)" multiline numberOfLines={3} />
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
