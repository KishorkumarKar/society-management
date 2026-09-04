import type { AuthenticatedUser } from "@/lib/types";
import type { LoginResponse } from "@/lib/api/types";
import { deriveUserRole } from "@/lib/auth/roleMapping";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Builds the app-facing AuthenticatedUser from a POST /auth/login (or a
 *  cached copy of one) response. */
export function toAuthenticatedUser(login: LoginResponse): AuthenticatedUser {
  return {
    id: String(login.user.id),
    societyId: String(login.user.societyId),
    flatId: login.user.flatId === null ? null : String(login.user.flatId),
    name: login.user.name,
    email: login.user.email,
    phone: login.user.phone,
    isActive: login.user.isActive,
    role: deriveUserRole(login.roles, login.permissions),
    roles: login.roles,
    permissions: login.permissions,
    societyName: login.society.name,
    societySlug: login.society.slug,
    initial: initialsFromName(login.user.name),
    unit: "",
    designation: "",
  };
}
