import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PublicStackParamList } from './types';
import { LandingScreen } from '../features/landing/LandingScreen';
import { LoginScreen } from '../features/auth/LoginScreen';
import { AboutScreen } from '../features/about/AboutScreen';
import { ContactScreen } from '../features/contact/ContactScreen';
import { TermsScreen } from '../features/legal/TermsScreen';
import { LogViewerScreen } from '../features/debug/LogViewerScreen';

const Stack = createNativeStackNavigator<PublicStackParamList>();

export function PublicStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: true, title: 'About' }} />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ headerShown: true, title: 'Contact' }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: true, title: 'Terms & Conditions' }} />
      <Stack.Screen name="LogViewer" component={LogViewerScreen} options={{ headerShown: true, title: 'Log Viewer' }} />
    </Stack.Navigator>
  );
}
