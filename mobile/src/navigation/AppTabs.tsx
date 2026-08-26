import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AppTabParamList } from './types';
import { useAuthStore } from '../store/authStore';
import { hasAnyPermission } from '../acl/PermissionGate';
import { PERMISSIONS } from '../acl/permissions';
import { useAppTheme } from '../theme/ThemeContext';

import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { UsersListScreen } from '../features/users/UsersListScreen';
import { MaintenanceListScreen } from '../features/maintenance/MaintenanceListScreen';
import { AnnouncementsListScreen } from '../features/announcements/AnnouncementsListScreen';
import { HallBookingsListScreen } from '../features/hall-bookings/HallBookingsListScreen';
import { MoreScreen } from '../features/profile/MoreScreen';

const Tab = createBottomTabNavigator<AppTabParamList>();

const ICONS: Record<keyof AppTabParamList, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'home-outline',
  Users: 'people-outline',
  Maintenance: 'receipt-outline',
  Announcements: 'megaphone-outline',
  HallBookings: 'calendar-outline',
  More: 'ellipsis-horizontal-circle-outline',
};

/**
 * The tab bar is deliberately short: Dashboard and More are always present,
 * everything else only appears if the signed-in user holds the *.view
 * permission for that module — driven entirely by the permissions array
 * POST /auth/login returned, never by role name. Modules that don't fit a
 * 5-icon tab bar (Flats, Expenses, Roles, Permissions, Societies) are one
 * tap away via Dashboard quick-links / More, each independently gated the
 * same way. Hiding a tab is a UX convenience only — the backend's
 * `authorize()` middleware is still the real gate on every request.
 */
export function AppTabs() {
  const permissions = useAuthStore((s) => s.permissions);
  const { theme } = useAppTheme();

  const visible = useMemo(
    () => ({
      Users: hasAnyPermission(permissions, [PERMISSIONS.USERS_VIEW]),
      Maintenance: hasAnyPermission(permissions, [PERMISSIONS.MAINTENANCE_VIEW]),
      Announcements: hasAnyPermission(permissions, [PERMISSIONS.ANNOUNCEMENTS_VIEW]),
      HallBookings: hasAnyPermission(permissions, [PERMISSIONS.HALL_BOOKINGS_VIEW]),
    }),
    [permissions],
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primaryDark,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.tabBar, borderTopColor: theme.border },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name as keyof AppTabParamList]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      {visible.Maintenance && <Tab.Screen name="Maintenance" component={MaintenanceListScreen} />}
      {visible.Announcements && <Tab.Screen name="Announcements" component={AnnouncementsListScreen} />}
      {visible.HallBookings && (
        <Tab.Screen name="HallBookings" component={HallBookingsListScreen} options={{ title: 'Hall Bookings' }} />
      )}
      {visible.Users && <Tab.Screen name="Users" component={UsersListScreen} />}
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}
