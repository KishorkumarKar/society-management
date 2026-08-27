import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
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
import { approveHallBooking, cancelHallBooking, getHallBooking, rejectHallBooking } from '../../api/endpoints/hall-bookings';
import { AppStackParamList } from '../../navigation/types';
import { ApiRequestError } from '../../api/types';

type Route = RouteProp<AppStackParamList, 'HallBookingDetail'>;

export function HallBookingDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['hall-booking', params.id], queryFn: () => getHallBooking(params.id) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['hall-booking', params.id] });
  const onError = (label: string) => (err: unknown) => {
    const message = err instanceof ApiRequestError ? err.message : `Could not ${label} this booking.`;
    Alert.alert('Action failed', message);
  };

  const approve = useMutation({ mutationFn: () => approveHallBooking(params.id), onSuccess: invalidate, onError: onError('approve') });
  const reject = useMutation({ mutationFn: () => rejectHallBooking(params.id), onSuccess: invalidate, onError: onError('reject') });
  const cancel = useMutation({
    mutationFn: () => cancelHallBooking(params.id),
    onSuccess: () => { invalidate(); navigation.goBack(); },
    onError: onError('cancel'),
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) {
    const { message, requestId } = describeQueryError(query.error, 'Could not load this booking.');
    return <ErrorState message={message} onRetry={() => query.refetch()} requestId={requestId} />;
  }

  const b = query.data;
  const isPending = b.status === 'pending';

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[styles.purpose, { color: theme.text }]}>{b.purpose}</Text>
            <StatusPill status={b.status} />
          </View>
          <View style={{ marginTop: 12, gap: 4 }}>
            <Text style={[styles.row, { color: theme.textMuted }]}>From {new Date(b.start_time).toLocaleString()}</Text>
            <Text style={[styles.row, { color: theme.textMuted }]}>To {new Date(b.end_time).toLocaleString()}</Text>
          </View>
        </Card>

        {isPending && (
          <PermissionGate permission={PERMISSIONS.HALL_BOOKINGS_APPROVE}>
            <Button label="Approve" loading={approve.isPending} onPress={() => approve.mutate()} />
          </PermissionGate>
        )}
        {isPending && (
          <PermissionGate permission={PERMISSIONS.HALL_BOOKINGS_REJECT}>
            <Button label="Reject" variant="secondary" loading={reject.isPending} onPress={() => reject.mutate()} />
          </PermissionGate>
        )}
        {isPending && (
          <PermissionGate permission={PERMISSIONS.HALL_BOOKINGS_CANCEL}>
            <Button
              label="Cancel booking"
              variant="danger"
              loading={cancel.isPending}
              onPress={() =>
                Alert.alert('Cancel this booking?', undefined, [
                  { text: 'Keep it', style: 'cancel' },
                  { text: 'Cancel booking', style: 'destructive', onPress: () => cancel.mutate() },
                ])
              }
            />
          </PermissionGate>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  purpose: { fontFamily: fontFamilies.display, fontSize: 19, flex: 1, marginRight: 12 },
  row: { fontFamily: fontFamilies.sans, fontSize: 13 },
});
