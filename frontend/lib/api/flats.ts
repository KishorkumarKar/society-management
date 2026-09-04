import { apiFetch, apiFetchList, type ApiListResult } from "@/lib/api/http";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { BackendFlat } from "@/lib/api/types";

export interface ListFlatsQuery {
  page?: number;
  limit?: number;
  search?: string;
  block?: string;
  sort?: "unit_no" | "-unit_no" | "created_at" | "-created_at";
}

/** GET /flats — requires `flats.view`; tenant-isolated to the caller's
 *  own society, same as /users (no cross-society bypass, not even for
 *  Super Admin). */
export function listFlats(query: ListFlatsQuery = {}): Promise<ApiListResult<BackendFlat>> {
  return apiFetchList<BackendFlat>(ENDPOINTS.flats.list, { query: { ...query } });
}

export function getFlat(id: number): Promise<BackendFlat> {
  return apiFetch<BackendFlat>(ENDPOINTS.flats.byId(id));
}

/** Matches createFlatSchema exactly. */
export interface CreateFlatPayload {
  block: string;
  floor: string;
  unitNo: string;
  ownerId?: number | null;
  sqft?: number;
  pricePerSqft?: number | null;
  fixPrice?: number | null;
}

/** POST /flats — requires `flats.create`. */
export function createFlat(payload: CreateFlatPayload): Promise<BackendFlat> {
  return apiFetch<BackendFlat>(ENDPOINTS.flats.list, { method: "POST", body: payload });
}

/** Matches updateFlatSchema — every field optional, same shape as create. */
export interface UpdateFlatPayload {
  block?: string;
  floor?: string;
  unitNo?: string;
  ownerId?: number | null;
  sqft?: number;
  pricePerSqft?: number | null;
  fixPrice?: number | null;
}

export function updateFlat(id: number, payload: UpdateFlatPayload): Promise<BackendFlat> {
  return apiFetch<BackendFlat>(ENDPOINTS.flats.byId(id), { method: "PATCH", body: payload });
}

export function deleteFlat(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.flats.byId(id), { method: "DELETE" });
}
