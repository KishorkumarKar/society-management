import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { Button } from './Button';

export function LoadingState() {
  const { theme } = useAppTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.primary} />
    </View>
  );
}

export function ErrorState({ message, onRetry, requestId }: { message: string; onRetry?: () => void; requestId?: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.title, { color: theme.text }]}>Something went wrong</Text>
      <Text style={[styles.body, { color: theme.textMuted }]}>{message}</Text>
      {requestId && (
        <Text style={[styles.body, { color: theme.textMuted, fontFamily: fontFamilies.mono, fontSize: 10 }]}>
          Reference: {requestId}
        </Text>
      )}
      {onRetry && <View style={{ marginTop: 16, width: 140 }}><Button label="Try again" onPress={onRetry} variant="secondary" /></View>}
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {subtitle && <Text style={[styles.body, { color: theme.textMuted }]}>{subtitle}</Text>}
    </View>
  );
}

export function SkeletonList() {
  const { theme } = useAppTheme();
  return (
    <FlatList
      data={[1, 2, 3, 4, 5]}
      keyExtractor={(i) => String(i)}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      renderItem={() => (
        <View style={{ height: 72, borderRadius: 12, backgroundColor: theme.surfaceDim }} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 6 },
  title: { fontFamily: fontFamilies.sansSemiBold, fontSize: 16, textAlign: 'center' },
  body: { fontFamily: fontFamilies.sans, fontSize: 13, textAlign: 'center' },
});
