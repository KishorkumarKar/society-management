import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/StatusPill';
import { describeQueryError } from '../../lib/describeQueryError';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { PermissionGate } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { deleteAnnouncement, getAnnouncement, sendAnnouncement } from '../../api/endpoints/announcements';
import { AppStackParamList } from '../../navigation/types';
import { ApiRequestError } from '../../api/types';

type Route = RouteProp<AppStackParamList, 'AnnouncementDetail'>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'AnnouncementDetail'>;

export function AnnouncementDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
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

  const remove = useMutation({
    mutationFn: () => deleteAnnouncement(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      navigation.goBack();
    },
    onError: (err) => {
      const message = err instanceof ApiRequestError ? err.message : 'Could not delete this announcement.';
      Alert.alert('Delete failed', message);
    },
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) {
    const { message, requestId } = describeQueryError(query.error, 'Could not load this announcement.');
    return <ErrorState message={message} onRetry={() => query.refetch()} requestId={requestId} />;
  }

  const a = query.data;
  const isSent = a.sent_at != null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[styles.title, { color: theme.text }]}>{a.title}</Text>
            <StatusPill status={isSent ? 'sent' : 'pending'} />
          </View>
          <Text style={[styles.body, { color: theme.textMuted }]}>{a.body}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <View style={[styles.chip, { borderColor: theme.border }]}>
              <Text style={[styles.chipText, { color: theme.textMuted }]}>{a.priority}</Text>
            </View>
            {a.targetRoleIds.length > 0 && (
              <View style={[styles.chip, { borderColor: theme.border }]}>
                <Text style={[styles.chipText, { color: theme.textMuted }]}>{a.targetRoleIds.length} targeted role(s)</Text>
              </View>
            )}
          </View>
          <Text style={[styles.date, { color: theme.textMuted }]}>
            Posted {new Date(a.created_at).toLocaleString()}
            {isSent && a.sent_at ? ` · Sent ${new Date(a.sent_at).toLocaleString()}` : ''}
          </Text>
        </Card>

        <PermissionGate permission={PERMISSIONS.ANNOUNCEMENTS_SEND}>
          {!isSent && (
            <Button
              label="Send to residents"
              loading={send.isPending}
              onPress={() =>
                Alert.alert('Send this announcement?', 'It will be delivered to every targeted resident in the society.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Send', onPress: () => send.mutate() },
                ])
              }
            />
          )}
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.ANNOUNCEMENTS_UPDATE}>
          <Button label="Edit announcement" variant="secondary" onPress={() => navigation.navigate('AnnouncementEdit', { id: params.id })} />
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.ANNOUNCEMENTS_DELETE}>
          <Button
            label="Delete announcement"
            variant="danger"
            loading={remove.isPending}
            onPress={() =>
              Alert.alert('Delete this announcement?', 'This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => remove.mutate() },
              ])
            }
          />
        </PermissionGate>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fontFamilies.display, fontSize: 20, flex: 1, marginRight: 12 },
  body: { fontFamily: fontFamilies.sans, fontSize: 14, lineHeight: 21, marginTop: 12 },
  date: { fontFamily: fontFamilies.sans, fontSize: 12, marginTop: 12 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: fontFamilies.mono, fontSize: 10, textTransform: 'uppercase' },
});
