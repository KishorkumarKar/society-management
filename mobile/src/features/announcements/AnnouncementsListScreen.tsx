import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { EntityListScreen } from '../../components/ui/EntityListScreen';
import { FAB } from '../../components/ui/FAB';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { PermissionGate } from '../../acl/PermissionGate';
import { PERMISSIONS } from '../../acl/permissions';
import { listAnnouncements } from '../../api/endpoints/announcements';
import { Announcement } from '../../api/types';
import { AppStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

export function AnnouncementsListScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();

  return (
    <Screen>
      <EntityListScreen<Announcement>
        queryKey="announcements"
        fetchPage={(page) => listAnnouncements({ page, limit: 20 })}
        keyExtractor={(a) => String(a.id)}
        emptyTitle="No announcements yet"
        emptySubtitle="Notices your committee posts will show up here."
        renderItem={(a) => (
          <Pressable onPress={() => navigation.navigate('AnnouncementDetail', { id: a.id })}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{a.title}</Text>
                  <Text style={[styles.body, { color: theme.textMuted }]} numberOfLines={2}>{a.body}</Text>
                </View>
                <StatusPill status={a.sent_at != null ? 'sent' : 'pending'} />
              </View>
            </Card>
          </Pressable>
        )}
      />
      <PermissionGate permission={PERMISSIONS.ANNOUNCEMENTS_CREATE}>
        <FAB onPress={() => navigation.navigate('AnnouncementCreate')} />
      </PermissionGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fontFamilies.sansSemiBold, fontSize: 15 },
  body: { fontFamily: fontFamilies.sans, fontSize: 13, marginTop: 2 },
});
