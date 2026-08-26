import React from 'react';
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { theme } = useAppTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
