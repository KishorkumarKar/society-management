import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { getAnnouncement, updateAnnouncement } from '../../api/endpoints/announcements';
import { ApiRequestError, AnnouncementPriority } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

const PRIORITIES: AnnouncementPriority[] = ['low', 'normal', 'high', 'urgent'];

const schema = z.object({
  title: z.string().min(1, 'Enter a title'),
  body: z.string().min(1, 'Enter the announcement text'),
});
type FormValues = z.infer<typeof schema>;
type Route = RouteProp<AppStackParamList, 'AnnouncementEdit'>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'AnnouncementEdit'>;

export function AnnouncementEditScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();
  const [priority, setPriority] = React.useState<AnnouncementPriority>('normal');

  const query = useQuery({ queryKey: ['announcement', params.id], queryFn: () => getAnnouncement(params.id) });

  React.useEffect(() => {
    if (query.data) setPriority(query.data.priority);
  }, [query.data]);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', body: '' },
    values: query.data ? { title: query.data.title, body: query.data.body } : undefined,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => updateAnnouncement(params.id, { ...values, priority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement', params.id] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      navigation.goBack();
    },
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) {
    const { message, requestId } = describeQueryError(query.error, 'Could not load this announcement.');
    return <ErrorState message={message} onRetry={() => query.refetch()} requestId={requestId} />;
  }

  const serverError = mutation.error instanceof ApiRequestError ? mutation.error.message : null;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.text }]}>Edit announcement</Text>

          <View style={{ gap: 16 }}>
            <ControlledField control={control} name="title" label="Title" error={errors.title?.message} />
            <ControlledField control={control} name="body" label="Message" multiline numberOfLines={5} error={errors.body?.message} />

            <View>
              <Text style={[styles.label, { color: theme.textMuted }]}>Priority</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                {PRIORITIES.map((p) => {
                  const active = priority === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPriority(p)}
                      style={[
                        styles.chip,
                        { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : 'transparent' },
                      ]}
                    >
                      <Text style={{ color: active ? theme.onPrimary : theme.textMuted, fontFamily: fontFamilies.sansMedium, fontSize: 12 }}>
                        {p}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
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
  label: { fontFamily: fontFamilies.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  errorBox: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 16 },
});
