import { apiFetch, apiFetchList, type ApiListResult } from "@/lib/api/http";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { BackendSociety } from "@/lib/api/types";

export interface ListSocietiesQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 0 | 1;
  sort?: "name" | "-name" | "created_at" | "-created_at";
}

/** GET /societies — requires `societies.view`, which only the global
 *  "Super Admin" role has in the seeded data. Not usable pre-login (no
 *  public society directory endpoint exists), which is why the login form
 *  asks for the society's slug directly instead of offering a picker.
 *  Unlike /users and /flats, this endpoint is NOT tenant-isolated — it's
 *  the one genuinely cross-society list in the app. */
export function listSocieties(query: ListSocietiesQuery = {}): Promise<ApiListResult<BackendSociety>> {
  return apiFetchList<BackendSociety>(ENDPOINTS.societies.list, { query: { ...query } });
}

export function getSociety(id: number): Promise<BackendSociety> {
  return apiFetch<BackendSociety>(ENDPOINTS.societies.byId(id));
}

/** Matches createSocietySchema exactly. `slug` is permanent — it's the
 *  login code every user of this society types in, and there's no slug
 *  field in updateSocietySchema at all, so it can't be changed later. */
export interface CreateSocietyPayload {
  name: string;
  city: string;
  address: string;
  slug: string;
  userLimit?: number;
  registrationNo?: string | null;
  rateType?: "PER_SQFT" | "FIXED";
  ratePerSqft?: number;
}

export function createSociety(payload: CreateSocietyPayload): Promise<BackendSociety> {
  return apiFetch<BackendSociety>(ENDPOINTS.societies.list, { method: "POST", body: payload });
}

/** Matches updateSocietySchema — no `slug` (immutable, see above). */
export interface UpdateSocietyPayload {
  name?: string;
  city?: string;
  address?: string;
  userLimit?: number;
  registrationNo?: string | null;
  status?: 0 | 1;
  rateType?: "PER_SQFT" | "FIXED";
  ratePerSqft?: number;
}

export function updateSociety(id: number, payload: UpdateSocietyPayload): Promise<BackendSociety> {
  return apiFetch<BackendSociety>(ENDPOINTS.societies.byId(id), { method: "PATCH", body: payload });
}

/** DELETE /societies/:id — soft-delete on the backend. */
export function deleteSociety(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.societies.byId(id), { method: "DELETE" });
}
