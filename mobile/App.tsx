import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/lib/queryClient';
import { installGlobalErrorLogging } from './src/lib/globalErrorLogging';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import { useAppFonts } from './src/theme/typography';
import { RootNavigator } from './src/navigation/RootNavigator';

// As early as possible, before any component renders, so an error thrown
// during the very first render/effect is still caught — see
// src/lib/globalErrorLogging.ts for what this covers (and what it
// deliberately doesn't: that's ErrorBoundary's job).
installGlobalErrorLogging();

function AppShell() {
  const fontsLoaded = useAppFonts();
  const { theme } = useAppTheme();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AppShell />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
