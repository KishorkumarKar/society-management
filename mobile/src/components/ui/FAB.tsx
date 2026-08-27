import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';

/**
 * Users/Maintenance/Announcements live inside the bottom tab bar
 * (AppTabs.tsx), which renders with `headerShown: false` — so there's no
 * native header to hang a "+" button on the way Roles/Flats/Expenses do
 * (they're pushed screens in AppStack and use `navigation.setOptions` with
 * `headerRight` instead). This is the tab-screen equivalent.
 */
export function FAB({ onPress }: { onPress: () => void }) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Ionicons name="add" size={26} color={theme.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
});
