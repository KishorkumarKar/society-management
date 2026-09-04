/**
 * Barrel for the live-backend API layer. `@/lib/api/http` (apiFetch) is the
 * one place every module goes through — see it for auth-header attachment,
 * envelope unwrapping, and 401-refresh-retry behaviour.
 *
 * Wired into real UI so far: auth (login/session) + announcements +
 * users (dashboard's member directory). Everything else below is a typed
 * but not-yet-UI-wired foundation for the next phase — see each file's
 * header comment for known gaps to verify before building a form against it.
 */
export * from "@/lib/api/auth";
export * from "@/lib/api/session";
export * from "@/lib/api/endpoints";
export * from "@/lib/api/users";
export * from "@/lib/api/societies";
export * from "@/lib/api/announcements";
export * from "@/lib/api/flats";
export * from "@/lib/api/maintenance";
export * from "@/lib/api/roles";
export * from "@/lib/api/permissions";
export * from "@/lib/api/hallBookings";
export * from "@/lib/api/expenses";
export * from "@/lib/api/events";
export * from "@/lib/api/eventCollections";
export * from "@/lib/api/eventExpenses";
export * from "@/lib/api/notifications";
export { ApiError, ApiNetworkError } from "@/lib/api/http";
export type { ApiListResult } from "@/lib/api/http";
