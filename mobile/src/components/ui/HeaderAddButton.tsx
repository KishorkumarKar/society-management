import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';

/** Passed to `navigation.setOptions({ headerRight: () => <HeaderAddButton .../> })`. */
export function HeaderAddButton({ onPress }: { onPress: () => void }) {
  const { theme } = useAppTheme();
  return (
    <Pressable onPress={onPress} hitSlop={10} style={{ paddingHorizontal: 4 }}>
      <Ionicons name="add" size={26} color={theme.primaryDark} />
    </Pressable>
  );
}
