/**
 * Canonical permission names, `resource.action`. These are seeded into the
 * `permissions` table (see seeders/seed.ts) and referenced by controllers
 * via the `authorize()` middleware — never compared against a role name.
 */
export const PERMISSIONS = {
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_ASSIGN_ROLE: 'users.assign_role',

  SOCIETIES_VIEW: 'societies.view',
  SOCIETIES_CREATE: 'societies.create',
  SOCIETIES_UPDATE: 'societies.update',
  SOCIETIES_DELETE: 'societies.delete',

  FLATS_VIEW: 'flats.view',
  FLATS_CREATE: 'flats.create',
  FLATS_UPDATE: 'flats.update',
  FLATS_DELETE: 'flats.delete',

  MAINTENANCE_VIEW: 'maintenance.view',
  MAINTENANCE_CREATE: 'maintenance.create',
  MAINTENANCE_UPDATE: 'maintenance.update',
  MAINTENANCE_DELETE: 'maintenance.delete',
  MAINTENANCE_COLLECT: 'maintenance.collect',

  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  ROLES_ASSIGN_PERMISSION: 'roles.assign_permission',

  PERMISSIONS_VIEW: 'permissions.view',

  HALL_BOOKINGS_VIEW: 'hall_bookings.view',
  HALL_BOOKINGS_CREATE: 'hall_bookings.create',
  HALL_BOOKINGS_UPDATE: 'hall_bookings.update',
  HALL_BOOKINGS_DELETE: 'hall_bookings.delete',
  HALL_BOOKINGS_APPROVE: 'hall_bookings.approve',
  HALL_BOOKINGS_REJECT: 'hall_bookings.reject',
  HALL_BOOKINGS_CANCEL: 'hall_bookings.cancel',

  EXPENSES_VIEW: 'expenses.view',
  EXPENSES_CREATE: 'expenses.create',
  EXPENSES_UPDATE: 'expenses.update',
  EXPENSES_DELETE: 'expenses.delete',
  EXPENSES_APPROVE: 'expenses.approve',

  ANNOUNCEMENTS_VIEW: 'announcements.view',
  ANNOUNCEMENTS_CREATE: 'announcements.create',
  ANNOUNCEMENTS_UPDATE: 'announcements.update',
  ANNOUNCEMENTS_DELETE: 'announcements.delete',
  ANNOUNCEMENTS_SEND: 'announcements.send',

  NOTIFICATIONS_VIEW: 'notifications.view',
  NOTIFICATIONS_CREATE: 'notifications.create',
  NOTIFICATIONS_UPDATE: 'notifications.update',
  NOTIFICATIONS_DELETE: 'notifications.delete',
  NOTIFICATIONS_MARK_READ: 'notifications.mark_read',
  NOTIFICATIONS_SEND: 'notifications.send',
  /** Administrative: view/manage notifications belonging to OTHER users in the same society. */
  NOTIFICATIONS_VIEW_ALL: 'notifications.view_all',
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: {name: PermissionName; resource: string; action: string; description: string}[] =
  Object.values(PERMISSIONS).map((name) => {
    const [resource, action] = name.split('.');
    return {name, resource, action, description: `Permission to ${action} ${resource}`};
  });
