import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { logger, LogEntry, LogLevel } from '../../lib/logger';

const LEVELS: (LogLevel | 'all')[] = ['all', 'debug', 'info', 'warn', 'error'];

const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: '#7C8894',
  info: '#5F7161',
  warn: '#B8863B',
  error: '#A24936',
};

/**
 * On-device log viewer. Exists because most people hitting a bug are on a
 * real phone with no Metro terminal attached — this is where "record the
 * issue" actually happens, and it's reachable both signed-in (More screen)
 * and signed-out (a link on the Login screen), since auth/login failures
 * are exactly the kind of thing this needs to help debug.
 *
 * `logger.subscribe` re-renders this list live as new entries land, so a
 * person can open this screen, reproduce the bug, and watch it happen.
 */
export function LogViewerScreen() {
  const { theme } = useAppTheme();
  const [entries, setEntries] = useState<LogEntry[]>(logger.getEntries());
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [query, setQuery] = useState('');

  useEffect(() => logger.subscribe(setEntries), []);

  const filtered = useMemo(() => {
    return entries
      .filter((e) => levelFilter === 'all' || e.level === levelFilter)
      .filter((e) => {
        if (!query.trim()) return true;
        const haystack = `${e.scope} ${e.message} ${e.requestId ?? ''}`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      })
      .slice()
      .reverse(); // newest first
  }, [entries, levelFilter, query]);

  const handleShare = async () => {
    if (entries.length === 0) {
      Alert.alert('Nothing to share', 'No log entries recorded yet.');
      return;
    }
    try {
      await Share.share({ message: logger.exportAsText() });
    } catch {
      // User cancelled the share sheet — nothing to do.
    }
  };

  const handleClear = () => {
    Alert.alert('Clear logs', 'This removes all recorded log entries from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => logger.clear() },
    ]);
  };

  return (
    <Screen>
      <View style={styles.toolbar}>
        <FilterInput value={query} onChange={setQuery} theme={theme} />
        <View style={styles.levelRow}>
          {LEVELS.map((level) => (
            <Pressable
              key={level}
              onPress={() => setLevelFilter(level)}
              style={[
                styles.levelChip,
                {
                  borderColor: levelFilter === level ? theme.primary : theme.border,
                  backgroundColor: levelFilter === level ? theme.primary : 'transparent',
                },
              ]}
            >
              <Text style={[styles.levelChipLabel, { color: levelFilter === level ? theme.onPrimary : theme.textMuted }]}>
                {level.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.actionsRow}>
          <View style={{ flex: 1 }}>
            <Button label="Share log" onPress={handleShare} variant="secondary" />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Clear" onPress={handleClear} variant="danger" />
          </View>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 8 }}
        renderItem={({ item }) => <LogRow entry={item} />}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.textMuted }]}>
            {entries.length === 0 ? 'No log entries yet.' : 'No entries match this filter.'}
          </Text>
        }
      />
    </Screen>
  );
}

function FilterInput({ value, onChange, theme }: { value: string; onChange: (v: string) => void; theme: ReturnType<typeof useAppTheme>['theme'] }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Filter by scope, message or request ID"
      placeholderTextColor={theme.textMuted}
      style={[styles.search, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
    />
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const { theme } = useAppTheme();
  const time = new Date(entry.timestamp).toLocaleTimeString();
  const color = LEVEL_COLOR[entry.level];
  return (
    <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.rowHeader}>
        <View style={[styles.levelDot, { backgroundColor: color }]} />
        <Text style={[styles.rowScope, { color }]}>{entry.scope}</Text>
        <Text style={[styles.rowTime, { color: theme.textMuted }]}>{time}</Text>
      </View>
      <Text style={[styles.rowMessage, { color: theme.text }]}>{entry.message}</Text>
      {entry.requestId ? (
        <Text style={[styles.rowMeta, { color: theme.textMuted }]}>req: {entry.requestId}</Text>
      ) : null}
      {entry.data !== undefined ? (
        <Text style={[styles.rowMeta, { color: theme.textMuted }]} numberOfLines={4}>
          {safeStringify(entry.data)}
        </Text>
      ) : null}
    </View>
  );
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 0);
  } catch {
    return '[unserializable]';
  }
}

const styles = StyleSheet.create({
  toolbar: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  search: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fontFamilies.sans, fontSize: 14 },
  levelRow: { flexDirection: 'row', gap: 8 },
  levelChip: { borderWidth: 1, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  levelChipLabel: { fontFamily: fontFamilies.mono, fontSize: 10, letterSpacing: 0.5 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  row: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  levelDot: { width: 7, height: 7, borderRadius: 4 },
  rowScope: { fontFamily: fontFamilies.mono, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  rowTime: { fontFamily: fontFamilies.mono, fontSize: 10, marginLeft: 'auto' },
  rowMessage: { fontFamily: fontFamilies.sans, fontSize: 13, lineHeight: 18 },
  rowMeta: { fontFamily: fontFamilies.mono, fontSize: 10, lineHeight: 14 },
  empty: { textAlign: 'center', fontFamily: fontFamilies.sans, fontSize: 13, marginTop: 40 },
});
