import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { PermissionGate } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { getAnnouncement, sendAnnouncement } from '../../api/endpoints/announcements';
import { AppStackParamList } from '../../navigation/types';
import { ApiRequestError } from '../../api/types';

type Route = RouteProp<AppStackParamList, 'AnnouncementDetail'>;

export function AnnouncementDetailScreen() {
  const { params } = useRoute<Route>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['announcement', params.id], queryFn: () => getAnnouncement(params.id) });

  const send = useMutation({
    mutationFn: () => sendAnnouncement(params.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcement', params.id] }),
    onError: (err) => {
      const message = err instanceof ApiRequestError ? err.message : 'Could not send this announcement.';
      Alert.alert('Send failed', message);
    },
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) return <ErrorState message="Could not load this announcement." onRetry={() => query.refetch()} />;

  const a = query.data;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[styles.title, { color: theme.text }]}>{a.title}</Text>
            <StatusPill status={a.is_sent ? 'sent' : 'pending'} />
          </View>
          <Text style={[styles.body, { color: theme.textMuted }]}>{a.body}</Text>
          <Text style={[styles.date, { color: theme.textMuted }]}>{new Date(a.created_at).toLocaleString()}</Text>
        </Card>

        <PermissionGate permission={PERMISSIONS.ANNOUNCEMENTS_SEND}>
          {!a.is_sent && (
            <Button
              label="Send to all residents"
              loading={send.isPending}
              onPress={() =>
                Alert.alert('Send this announcement?', 'It will be delivered to every resident in the society.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Send', onPress: () => send.mutate() },
                ])
              }
            />
          )}
        </PermissionGate>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fontFamilies.display, fontSize: 20, flex: 1, marginRight: 12 },
  body: { fontFamily: fontFamilies.sans, fontSize: 14, lineHeight: 21, marginTop: 12 },
  date: { fontFamily: fontFamilies.sans, fontSize: 12, marginTop: 12 },
});
