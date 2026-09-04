import { apiFetch, apiFetchList, type ApiListResult } from "@/lib/api/http";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { BackendRole, BackendPermission } from "@/lib/api/types";

export interface ListRolesQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "name" | "-name" | "created_at" | "-created_at";
}

/** GET /roles — requires `roles.view`. Not tenant-isolated by middleware,
 *  but the service itself always scopes to the caller's society (plus any
 *  global/system roles like "Super Admin", which have `society_id: null`
 *  and are visible everywhere). */
export function listRoles(query: ListRolesQuery = {}): Promise<ApiListResult<BackendRole>> {
  return apiFetchList<BackendRole>(ENDPOINTS.roles.list, { query: { ...query } });
}

export function getRole(id: number): Promise<BackendRole> {
  return apiFetch<BackendRole>(ENDPOINTS.roles.byId(id));
}

/** Matches createRoleSchema. `isGlobal` is accepted by the backend but in
 *  practice only meaningful for a Super Admin caller creating a
 *  cross-society role — leave it unset for a normal society-scoped role. */
export interface CreateRolePayload {
  name: string;
  description?: string | null;
  isGlobal?: boolean;
}

/** POST /roles — requires `roles.create`. */
export function createRole(payload: CreateRolePayload): Promise<BackendRole> {
  return apiFetch<BackendRole>(ENDPOINTS.roles.list, { method: "POST", body: payload });
}

export interface UpdateRolePayload {
  name?: string;
  description?: string | null;
}

/** PATCH /roles/:id — requires `roles.update`. */
export function updateRole(id: number, payload: UpdateRolePayload): Promise<BackendRole> {
  return apiFetch<BackendRole>(ENDPOINTS.roles.byId(id), { method: "PATCH", body: payload });
}

/** DELETE /roles/:id — requires `roles.delete`. Soft-delete. */
export function deleteRole(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.roles.byId(id), { method: "DELETE" });
}

/** GET /roles/:id/permissions — requires `roles.view`. Unlike
 *  GET /users/:id/permissions (which only returns flattened effective
 *  permission strings), this returns the role's own permissions as full
 *  objects — the actual source of truth for what a role grants. */
export function listRolePermissions(roleId: number): Promise<BackendPermission[]> {
  return apiFetch<BackendPermission[]>(ENDPOINTS.roles.permissions(roleId));
}

/** POST /roles/:id/permissions — requires `roles.assign_permission`. */
export function assignRolePermission(roleId: number, permissionId: number): Promise<{ assigned: boolean }> {
  return apiFetch<{ assigned: boolean }>(ENDPOINTS.roles.permissions(roleId), {
    method: "POST",
    body: { permissionId },
  });
}

/** DELETE /roles/:id/permissions/:permissionId — requires
 *  `roles.assign_permission`. */
export function removeRolePermission(
  roleId: number,
  permissionId: number
): Promise<{ removed: boolean }> {
  return apiFetch<{ removed: boolean }>(ENDPOINTS.roles.permissionById(roleId, permissionId), {
    method: "DELETE",
  });
}
