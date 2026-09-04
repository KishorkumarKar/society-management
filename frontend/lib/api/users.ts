import { apiFetch, apiFetchList, type ApiListResult } from "@/lib/api/http";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { BackendUser } from "@/lib/api/types";

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  sort?: "name" | "-name" | "created_at" | "-created_at";
}

/** GET /users — requires the `users.view` permission; scoped to the
 *  caller's own society automatically (tenant isolation) — there is no
 *  cross-society listing, even for Super Admin, see
 *  backend/src/middleware/tenant-isolation.middleware.ts. */
export function listUsers(query: ListUsersQuery = {}): Promise<ApiListResult<BackendUser>> {
  return apiFetchList<BackendUser>(ENDPOINTS.users.list, { query: { ...query } });
}

export function getUser(id: number): Promise<BackendUser> {
  return apiFetch<BackendUser>(ENDPOINTS.users.byId(id));
}

/** Matches createUserSchema in
 *  backend/src/modules/users/users.validators.ts exactly: one of
 *  email/phone is required, password is required, roleIds is optional
 *  (defaults to none assigned). `vendorSocietyId` is accepted by the
 *  backend but only for a Super Admin caller — omit it otherwise. */
export interface CreateUserPayload {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  flatId?: number | null;
  roleIds?: number[];
  vendorSocietyId?: number | null;
}

/** POST /users — requires `users.create`. */
export function createUser(payload: CreateUserPayload): Promise<BackendUser> {
  return apiFetch<BackendUser>(ENDPOINTS.users.list, { method: "POST", body: payload });
}

/** Matches updateUserSchema — no password or roleIds here; roles are
 *  managed via assignUserRole/removeUserRole below, and there's no
 *  change-password route wired yet. */
export interface UpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
  flatId?: number | null;
  isActive?: boolean;
  vendorSocietyId?: number | null;
}

/** PATCH /users/:id — requires `users.update`. */
export function updateUser(id: number, payload: UpdateUserPayload): Promise<BackendUser> {
  return apiFetch<BackendUser>(ENDPOINTS.users.byId(id), { method: "PATCH", body: payload });
}

/** DELETE /users/:id — requires `users.delete`. Soft-delete on the
 *  backend. */
export function deleteUser(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.users.byId(id), { method: "DELETE" });
}

/** GET /users/:id/permissions — the user's effective "<resource>.<action>"
 *  permission strings, resolved from all of their assigned roles. This is
 *  the only way to see a user's access level — the backend doesn't return
 *  role names on the plain user object. */
export function getUserPermissions(id: number): Promise<{ permissions: string[] }> {
  return apiFetch<{ permissions: string[] }>(ENDPOINTS.users.permissions(id));
}

/** POST /users/:id/roles — requires `users.assign_role`. */
export function assignUserRole(id: number, roleId: number): Promise<{ assigned: boolean }> {
  return apiFetch<{ assigned: boolean }>(ENDPOINTS.users.roles(id), {
    method: "POST",
    body: { roleId },
  });
}

/** DELETE /users/:id/roles/:roleId — requires `users.assign_role`. */
export function removeUserRole(id: number, roleId: number): Promise<{ removed: boolean }> {
  return apiFetch<{ removed: boolean }>(ENDPOINTS.users.roleById(id, roleId), {
    method: "DELETE",
  });
}
