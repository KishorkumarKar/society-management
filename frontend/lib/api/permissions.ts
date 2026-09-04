import { apiFetchList, type ApiListResult } from "@/lib/api/http";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { BackendPermission } from "@/lib/api/types";

export interface ListPermissionsQuery {
  page?: number;
  limit?: number;
  resource?: string;
  search?: string;
}

/** GET /permissions — requires `permissions.view`. This is the global,
 *  seeded catalog of every "<resource>.<action>" permission that exists —
 *  used to build the picker when assigning a permission to a role. */
export function listPermissions(
  query: ListPermissionsQuery = {}
): Promise<ApiListResult<BackendPermission>> {
  return apiFetchList<BackendPermission>(ENDPOINTS.permissions.list, { query: { ...query } });
}
