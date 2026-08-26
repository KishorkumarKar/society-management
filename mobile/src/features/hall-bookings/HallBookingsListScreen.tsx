import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { EntityListScreen } from '../../components/ui/EntityListScreen';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { listHallBookings } from '../../api/endpoints/hall-bookings';
import { HallBooking } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function HallBookingsListScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();

  return (
    <Screen>
      <EntityListScreen<HallBooking>
        queryKey="hall-bookings"
        fetchPage={(page) => listHallBookings({ page, limit: 20 })}
        keyExtractor={(b) => String(b.id)}
        emptyTitle="No hall bookings"
        emptySubtitle="Requests to use the common hall will appear here."
        renderItem={(b) => (
          <Pressable onPress={() => navigation.navigate('HallBookingDetail', { id: b.id })}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.purpose, { color: theme.text }]}>{b.purpose}</Text>
                  <Text style={[styles.time, { color: theme.textMuted }]}>
                    {new Date(b.start_time).toLocaleString()}
                  </Text>
                </View>
                <StatusPill status={b.status} />
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  purpose: { fontFamily: fontFamilies.sansSemiBold, fontSize: 15 },
  time: { fontFamily: fontFamilies.sans, fontSize: 13, marginTop: 2 },
});
