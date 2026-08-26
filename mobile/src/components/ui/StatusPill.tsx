import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';

const TONES: Record<string, 'positive' | 'warning' | 'negative' | 'neutral'> = {
  paid: 'positive', approved: 'positive', active: 'positive', sent: 'positive',
  pending: 'warning', partial: 'warning',
  overdue: 'negative', rejected: 'negative', cancelled: 'negative', inactive: 'negative',
};

export function StatusPill({ status }: { status: string }) {
  const { theme } = useAppTheme();
  const tone = TONES[status] ?? 'neutral';
  const colors = {
    positive: theme.accent,
    warning: theme.primaryDark,
    negative: theme.danger,
    neutral: theme.textMuted,
  };
  const color = colors[tone];
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.label, { color }]}>{status.replace(/_/g, ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { borderWidth: 1, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10, alignSelf: 'flex-start' },
  label: { fontFamily: fontFamilies.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
});
