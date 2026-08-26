import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useAppTheme } from '../theme/ThemeContext';
import { PublicStack } from './PublicStack';
import { AppStack } from './AppStack';

/**
 * `status` starts 'unknown' (still checking secure storage), then resolves
 * to 'signedOut' (-> PublicStack: Landing/Login) or 'signedIn' (-> AppStack).
 * A forced logout from a 401 that survives refresh (api/client.ts's
 * onSessionExpired) flips this back to 'signedOut' automatically, which
 * unmounts AppStack and drops the user back on Landing — no dangling
 * authenticated screens left on the stack.
 */
export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const { theme } = useAppTheme();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  if (status === 'unknown') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const navTheme = theme.mode === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: theme.background, card: theme.surface, text: theme.text, border: theme.border, primary: theme.primary } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.background, card: theme.surface, text: theme.text, border: theme.border, primary: theme.primary } };

  return (
    <NavigationContainer theme={navTheme}>
      {status === 'signedIn' ? <AppStack /> : <PublicStack />}
    </NavigationContainer>
  );
}
