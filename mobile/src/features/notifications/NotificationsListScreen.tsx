import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EntityListScreen } from '../../components/ui/EntityListScreen';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { listNotifications, markAllRead, markRead } from '../../api/endpoints/notifications';
import { AppNotification } from '../../api/types';

export function NotificationsListScreen() {
  const { theme } = useAppTheme();
  const queryClient = useQueryClient();

  const handleMarkAllRead = async () => {
    await markAllRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="Mark all read" variant="ghost" onPress={handleMarkAllRead} />
      </View>
      <EntityListScreen<AppNotification>
        queryKey="notifications"
        fetchPage={(page) => listNotifications({ page, limit: 20 })}
        keyExtractor={(n) => String(n.id)}
        emptyTitle="You're all caught up"
        emptySubtitle="New notices and updates will show up here."
        renderItem={(n) => (
          <Pressable
            onPress={async () => {
              if (!n.is_read) {
                await markRead(n.id);
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
              }
            }}
          >
            <Card style={!n.is_read ? { borderColor: theme.primary } : undefined}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {!n.is_read && <View style={[styles.dot, { backgroundColor: theme.primary }]} />}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: theme.text }]}>{n.title}</Text>
                  <Text style={[styles.body, { color: theme.textMuted }]} numberOfLines={2}>{n.body}</Text>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, alignItems: 'flex-end' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  title: { fontFamily: fontFamilies.sansSemiBold, fontSize: 14 },
  body: { fontFamily: fontFamilies.sans, fontSize: 12, marginTop: 2 },
});
