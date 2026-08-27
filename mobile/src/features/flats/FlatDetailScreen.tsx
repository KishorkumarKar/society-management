import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingState, ErrorState } from '../../components/ui/States';
import { describeQueryError } from '../../lib/describeQueryError';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { PermissionGate } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { deleteFlat, getFlat } from '../../api/endpoints/flats';
import { AppStackParamList } from '../../navigation/types';
import { ApiRequestError } from '../../api/types';

type Route = RouteProp<AppStackParamList, 'FlatDetail'>;
type Nav = NativeStackNavigationProp<AppStackParamList, 'FlatDetail'>;

export function FlatDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['flat', params.id], queryFn: () => getFlat(params.id) });

  const remove = useMutation({
    mutationFn: () => deleteFlat(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flats'] });
      navigation.goBack();
    },
    onError: (err) => {
      const message = err instanceof ApiRequestError ? err.message : 'Could not delete this flat.';
      Alert.alert('Delete failed', message);
    },
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError || !query.data) {
    const { message, requestId } = describeQueryError(query.error, 'Could not load this flat.');
    return <ErrorState message={message} onRetry={() => query.refetch()} requestId={requestId} />;
  }

  const flat = query.data;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <Text style={[styles.unit, { color: theme.text }]}>Unit {flat.unit_no}</Text>
          <View style={{ marginTop: 12, gap: 4 }}>
            <Row label="Block" value={flat.block} theme={theme} />
            <Row label="Floor" value={flat.floor} theme={theme} />
            <Row label="Owner" value={flat.owner_id ? `User #${flat.owner_id}` : 'Unassigned'} theme={theme} />
            <Row label="Area" value={`${flat.sqft} sqft`} theme={theme} />
            {flat.price_per_sqft && <Row label="Rate" value={`₹${flat.price_per_sqft} / sqft`} theme={theme} />}
            {flat.fix_price && <Row label="Fixed price" value={`₹${flat.fix_price}`} theme={theme} />}
          </View>
        </Card>

        <PermissionGate permission={PERMISSIONS.FLATS_UPDATE}>
          <Button label="Edit flat" variant="secondary" onPress={() => navigation.navigate('FlatEdit', { id: params.id })} />
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.FLATS_DELETE}>
          <Button
            label="Delete flat"
            variant="danger"
            loading={remove.isPending}
            onPress={() =>
              Alert.alert('Delete this flat?', 'This cannot be undone, and fails if the flat still has bills or bookings attached.', [
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

function Row({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useAppTheme>['theme'] }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[styles.rowLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  unit: { fontFamily: fontFamilies.display, fontSize: 20 },
  rowLabel: { fontFamily: fontFamilies.sans, fontSize: 13 },
  rowValue: { fontFamily: fontFamilies.sansMedium, fontSize: 13 },
});
