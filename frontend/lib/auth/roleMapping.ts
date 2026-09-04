import type { UserRole } from "@/lib/types";

/**
 * The backend's RBAC is fully dynamic — a society can define any number of
 * named roles (Secretary, Treasurer, Committee, ...), each with its own
 * a-la-carte permission set (see backend/seeders/seed.ts). The rest of this
 * app, inherited from the mock-data version, gates UI on a single fixed
 * `UserRole` union instead. Until the admin console is migrated
 * module-by-module to read `permissions` directly, this function bridges
 * the two: it derives the closest-fitting `UserRole` from what
 * POST /auth/login actually returns, so routing/guards keep working for
 * any backend role, not just the five the mock data shipped with.
 *
 * Order matters — most-privileged match wins:
 *   1. "Super Admin" role (global, all permissions)              -> super-admin
 *   2. Can manage users/roles (users.create or roles.create)     -> admin
 *   3. Can view the member directory / approve things            -> committee
 *   4. Security-desk permission set (flats/users view, no create) -> security
 *   5. Everyone else                                             -> resident
 */
export function deriveUserRole(roles: string[], permissions: string[]): UserRole {
  const roleNames = roles.map((r) => r.toLowerCase());
  const perms = new Set(permissions);

  if (roleNames.includes("super admin")) return "super-admin";
  if (perms.has("users.create") || perms.has("roles.create") || perms.has("societies.create")) {
    return "admin";
  }
  if (
    perms.has("hall_bookings.approve") ||
    perms.has("expenses.approve") ||
    (perms.has("users.view") && !perms.has("users.create"))
  ) {
    // Security desk (users.view + flats.view, nothing else meaningful) is
    // checked before the broader "can view members" committee case.
    if (
      roleNames.some((r) => r.includes("security")) ||
      (perms.has("users.view") && !perms.has("announcements.view") && !perms.has("expenses.view"))
    ) {
      return "security";
    }
    return "committee";
  }
  return "resident";
}
