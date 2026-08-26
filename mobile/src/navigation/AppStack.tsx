import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from './types';
import { AppTabs } from './AppTabs';
import { UserDetailScreen } from '../features/users/UserDetailScreen';
import { MaintenanceDetailScreen } from '../features/maintenance/MaintenanceDetailScreen';
import { AnnouncementDetailScreen } from '../features/announcements/AnnouncementDetailScreen';
import { HallBookingDetailScreen } from '../features/hall-bookings/HallBookingDetailScreen';
import { RolesListScreen } from '../features/roles/RolesListScreen';
import { RoleDetailScreen } from '../features/roles/RoleDetailScreen';
import { PermissionsListScreen } from '../features/permissions/PermissionsListScreen';
import { SocietiesListScreen } from '../features/societies/SocietiesListScreen';
import { FlatsListScreen } from '../features/flats/FlatsListScreen';
import { ExpensesListScreen } from '../features/expenses/ExpensesListScreen';
import { NotificationsListScreen } from '../features/notifications/NotificationsListScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { AboutScreen } from '../features/about/AboutScreen';
import { ContactScreen } from '../features/contact/ContactScreen';
import { TermsScreen } from '../features/legal/TermsScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

/**
 * Flats, Expenses, Roles, Permissions and Societies live one tap deep from
 * Dashboard/More rather than as permanent tabs — most signed-in residents
 * only ever touch 2-3 modules, so a 7-icon tab bar would be mostly dead
 * weight for them. Committee/admin users reach the rest from the Dashboard
 * quick-links or the More screen, both of which are themselves
 * permission-gated.
 */
export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: undefined }}>
      <Stack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} options={{ title: 'Resident' }} />
      <Stack.Screen name="MaintenanceDetail" component={MaintenanceDetailScreen} options={{ title: 'Bill' }} />
      <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} options={{ title: 'Announcement' }} />
      <Stack.Screen name="HallBookingDetail" component={HallBookingDetailScreen} options={{ title: 'Hall Booking' }} />
      <Stack.Screen name="Roles" component={RolesListScreen} options={{ title: 'Roles' }} />
      <Stack.Screen name="RoleDetail" component={RoleDetailScreen} options={{ title: 'Role' }} />
      <Stack.Screen name="Permissions" component={PermissionsListScreen} options={{ title: 'Permissions' }} />
      <Stack.Screen name="Societies" component={SocietiesListScreen} options={{ title: 'Societies' }} />
      <Stack.Screen name="Flats" component={FlatsListScreen} options={{ title: 'Flats' }} />
      <Stack.Screen name="Expenses" component={ExpensesListScreen} options={{ title: 'Expenses' }} />
      <Stack.Screen name="Notifications" component={NotificationsListScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ title: 'Contact' }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms & Conditions' }} />
    </Stack.Navigator>
  );
}
