import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from './types';
import { AppTabs } from './AppTabs';

import { UserDetailScreen } from '../features/users/UserDetailScreen';
import { UserCreateScreen } from '../features/users/UserCreateScreen';
import { UserEditScreen } from '../features/users/UserEditScreen';

import { MaintenanceDetailScreen } from '../features/maintenance/MaintenanceDetailScreen';
import { MaintenanceCreateScreen } from '../features/maintenance/MaintenanceCreateScreen';
import { MaintenanceEditScreen } from '../features/maintenance/MaintenanceEditScreen';

import { AnnouncementDetailScreen } from '../features/announcements/AnnouncementDetailScreen';
import { AnnouncementCreateScreen } from '../features/announcements/AnnouncementCreateScreen';
import { AnnouncementEditScreen } from '../features/announcements/AnnouncementEditScreen';

import { HallBookingDetailScreen } from '../features/hall-bookings/HallBookingDetailScreen';

import { RolesListScreen } from '../features/roles/RolesListScreen';
import { RoleDetailScreen } from '../features/roles/RoleDetailScreen';
import { RoleCreateScreen } from '../features/roles/RoleCreateScreen';
import { RoleEditScreen } from '../features/roles/RoleEditScreen';

import { PermissionsListScreen } from '../features/permissions/PermissionsListScreen';
import { SocietiesListScreen } from '../features/societies/SocietiesListScreen';

import { FlatsListScreen } from '../features/flats/FlatsListScreen';
import { FlatDetailScreen } from '../features/flats/FlatDetailScreen';
import { FlatCreateScreen } from '../features/flats/FlatCreateScreen';
import { FlatEditScreen } from '../features/flats/FlatEditScreen';

import { ExpensesListScreen } from '../features/expenses/ExpensesListScreen';
import { ExpenseDetailScreen } from '../features/expenses/ExpenseDetailScreen';
import { ExpenseCreateScreen } from '../features/expenses/ExpenseCreateScreen';
import { ExpenseEditScreen } from '../features/expenses/ExpenseEditScreen';

import { NotificationsListScreen } from '../features/notifications/NotificationsListScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { AboutScreen } from '../features/about/AboutScreen';
import { ContactScreen } from '../features/contact/ContactScreen';
import { TermsScreen } from '../features/legal/TermsScreen';
import { LogViewerScreen } from '../features/debug/LogViewerScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

/**
 * Flats, Expenses, Roles, Permissions and Societies live one tap deep from
 * Dashboard/More rather than as permanent tabs — most signed-in residents
 * only ever touch 2-3 modules, so a 7-icon tab bar would be mostly dead
 * weight for them. Committee/admin users reach the rest from the Dashboard
 * quick-links or the More screen, both of which are themselves
 * permission-gated. Create/Edit screens for every module push in the same
 * stack, on top of their List/Detail screen.
 */
export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: undefined }}>
      <Stack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />

      <Stack.Screen name="UserDetail" component={UserDetailScreen} options={{ title: 'Resident' }} />
      <Stack.Screen name="UserCreate" component={UserCreateScreen} options={{ title: 'Add resident' }} />
      <Stack.Screen name="UserEdit" component={UserEditScreen} options={{ title: 'Edit resident' }} />

      <Stack.Screen name="MaintenanceDetail" component={MaintenanceDetailScreen} options={{ title: 'Bill' }} />
      <Stack.Screen name="MaintenanceCreate" component={MaintenanceCreateScreen} options={{ title: 'New bill' }} />
      <Stack.Screen name="MaintenanceEdit" component={MaintenanceEditScreen} options={{ title: 'Edit bill' }} />

      <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} options={{ title: 'Announcement' }} />
      <Stack.Screen name="AnnouncementCreate" component={AnnouncementCreateScreen} options={{ title: 'New announcement' }} />
      <Stack.Screen name="AnnouncementEdit" component={AnnouncementEditScreen} options={{ title: 'Edit announcement' }} />

      <Stack.Screen name="HallBookingDetail" component={HallBookingDetailScreen} options={{ title: 'Hall Booking' }} />

      <Stack.Screen name="Roles" component={RolesListScreen} options={{ title: 'Roles' }} />
      <Stack.Screen name="RoleDetail" component={RoleDetailScreen} options={{ title: 'Role' }} />
      <Stack.Screen name="RoleCreate" component={RoleCreateScreen} options={{ title: 'New role' }} />
      <Stack.Screen name="RoleEdit" component={RoleEditScreen} options={{ title: 'Edit role' }} />

      <Stack.Screen name="Permissions" component={PermissionsListScreen} options={{ title: 'Permissions' }} />
      <Stack.Screen name="Societies" component={SocietiesListScreen} options={{ title: 'Societies' }} />

      <Stack.Screen name="Flats" component={FlatsListScreen} options={{ title: 'Flats' }} />
      <Stack.Screen name="FlatDetail" component={FlatDetailScreen} options={{ title: 'Flat' }} />
      <Stack.Screen name="FlatCreate" component={FlatCreateScreen} options={{ title: 'New flat' }} />
      <Stack.Screen name="FlatEdit" component={FlatEditScreen} options={{ title: 'Edit flat' }} />

      <Stack.Screen name="Expenses" component={ExpensesListScreen} options={{ title: 'Expenses' }} />
      <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} options={{ title: 'Expense' }} />
      <Stack.Screen name="ExpenseCreate" component={ExpenseCreateScreen} options={{ title: 'New expense' }} />
      <Stack.Screen name="ExpenseEdit" component={ExpenseEditScreen} options={{ title: 'Edit expense' }} />

      <Stack.Screen name="Notifications" component={NotificationsListScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ title: 'Contact' }} />
      <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms & Conditions' }} />
      <Stack.Screen name="LogViewer" component={LogViewerScreen} options={{ title: 'Log Viewer' }} />
    </Stack.Navigator>
  );
}
