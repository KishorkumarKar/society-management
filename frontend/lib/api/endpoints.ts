/**
 * ---------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for every backend endpoint PATH. Every file in
 * lib/api/ imports its paths from here instead of typing a route string
 * inline — so renaming, moving, or restructuring a route is a one-line
 * change here, not a grep-and-replace across the codebase.
 *
 * Paths are relative to API_BASE_URL (host + "/api/<version>" — see
 * config.ts). Nothing here hardcodes a host or a version.
 * ---------------------------------------------------------------------
 */

type Id = number | string;

export const ENDPOINTS = {
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },
  users: {
    list: "/users",
    byId: (id: Id) => `/users/${id}`,
    permissions: (id: Id) => `/users/${id}/permissions`,
    roles: (id: Id) => `/users/${id}/roles`,
    roleById: (id: Id, roleId: Id) => `/users/${id}/roles/${roleId}`,
  },
  societies: {
    list: "/societies",
    byId: (id: Id) => `/societies/${id}`,
  },
  announcements: {
    list: "/announcements",
    byId: (id: Id) => `/announcements/${id}`,
    send: (id: Id) => `/announcements/${id}/send`,
  },
  flats: {
    list: "/flats",
    byId: (id: Id) => `/flats/${id}`,
  },
  maintenanceBills: {
    list: "/maintenance-bills",
    byId: (id: Id) => `/maintenance-bills/${id}`,
    payments: (id: Id) => `/maintenance-bills/${id}/payments`,
  },
  roles: {
    list: "/roles",
    byId: (id: Id) => `/roles/${id}`,
    permissions: (id: Id) => `/roles/${id}/permissions`,
    permissionById: (id: Id, permissionId: Id) => `/roles/${id}/permissions/${permissionId}`,
  },
  permissions: {
    list: "/permissions",
  },
  hallBookings: {
    list: "/hall-bookings",
    byId: (id: Id) => `/hall-bookings/${id}`,
    approve: (id: Id) => `/hall-bookings/${id}/approve`,
    reject: (id: Id) => `/hall-bookings/${id}/reject`,
    cancel: (id: Id) => `/hall-bookings/${id}/cancel`,
  },
  expenses: {
    list: "/expenses",
    byId: (id: Id) => `/expenses/${id}`,
    approve: (id: Id) => `/expenses/${id}/approve`,
  },
  events: {
    list: "/events",
    byId: (id: Id) => `/events/${id}`,
  },
  eventCollections: {
    list: "/event-collections",
    byId: (id: Id) => `/event-collections/${id}`,
  },
  eventExpenses: {
    list: "/event-expenses",
    byId: (id: Id) => `/event-expenses/${id}`,
  },
  notifications: {
    list: "/notifications",
    byId: (id: Id) => `/notifications/${id}`,
    markRead: (id: Id) => `/notifications/${id}/read`,
    readAll: "/notifications/read-all",
  },
} as const;
