import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const { theme } = useAppTheme();
  const isDisabled = disabled || loading;

  const backgrounds: Record<string, string> = {
    primary: theme.primary,
    secondary: 'transparent',
    ghost: 'transparent',
    danger: theme.danger,
  };
  const textColors: Record<string, string> = {
    primary: theme.onPrimary,
    secondary: theme.text,
    ghost: theme.primaryDark,
    danger: '#FFFFFF',
  };
  const borders: Record<string, string> = {
    primary: theme.primary,
    secondary: theme.border,
    ghost: 'transparent',
    danger: theme.danger,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: backgrounds[variant],
          borderColor: borders[variant],
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <Text style={[styles.label, { color: textColors[variant] }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fontFamilies.sansSemiBold, fontSize: 15 },
});
