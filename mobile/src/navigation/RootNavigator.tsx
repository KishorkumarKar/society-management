import React, { useEffect, useRef } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, NavigationState } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useAppTheme } from '../theme/ThemeContext';
import { logger } from '../lib/logger';
import { PublicStack } from './PublicStack';
import { AppStack } from './AppStack';

/** Walks a nav state to the name of the currently focused leaf route. */
function getActiveRouteName(state: NavigationState | undefined): string | undefined {
  if (!state) return undefined;
  const route = state.routes[state.index];
  if (route.state) return getActiveRouteName(route.state as NavigationState);
  return route.name;
}

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
  const previousRouteName = useRef<string | undefined>(undefined);

  useEffect(() => {
    logger.info('app', 'App launched');
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    logger.info('auth', `Auth status changed: ${status}`);
  }, [status]);

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
    <NavigationContainer
      theme={navTheme}
      onStateChange={(state) => {
        const routeName = getActiveRouteName(state);
        if (routeName && routeName !== previousRouteName.current) {
          logger.debug('nav', `Screen: ${routeName}`);
          previousRouteName.current = routeName;
        }
      }}
    >
      {status === 'signedIn' ? <AppStack /> : <PublicStack />}
    </NavigationContainer>
  );
}
