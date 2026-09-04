import { apiFetch, apiFetchList, type ApiListResult } from "@/lib/api/http";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { BackendEventCollection } from "@/lib/api/types";

/** Per-member contributions toward a specific event's target amount —
 *  memberName/unit are free text (not a users/flats foreign key), so
 *  this works even for non-resident contributors. */
export interface ListEventCollectionsQuery {
  page?: number;
  limit?: number;
  search?: string;
  eventId?: number;
  status?: "pending" | "partial" | "paid";
  unit?: string;
  sort?: "created_at" | "-created_at" | "payment_date" | "-payment_date";
}

/** GET /event-collections — requires `event_collections.view`. */
export function listEventCollections(
  query: ListEventCollectionsQuery = {}
): Promise<ApiListResult<BackendEventCollection>> {
  return apiFetchList<BackendEventCollection>(ENDPOINTS.eventCollections.list, { query: { ...query } });
}

export function getEventCollection(id: number): Promise<BackendEventCollection> {
  return apiFetch<BackendEventCollection>(ENDPOINTS.eventCollections.byId(id));
}

/** Matches createEventCollectionSchema. `status` is optional — if
 *  omitted, the backend derives it from amountPaid vs amountDue. */
export interface CreateEventCollectionPayload {
  eventId: number;
  memberName: string;
  unit: string;
  amountDue: number;
  amountPaid?: number;
  paymentDate?: string | null;
  status?: "pending" | "partial" | "paid";
  notes?: string | null;
}

/** POST /event-collections — requires `event_collections.create`. */
export function createEventCollection(
  payload: CreateEventCollectionPayload
): Promise<BackendEventCollection> {
  return apiFetch<BackendEventCollection>(ENDPOINTS.eventCollections.list, {
    method: "POST",
    body: payload,
  });
}

export interface UpdateEventCollectionPayload {
  memberName?: string;
  unit?: string;
  amountDue?: number;
  amountPaid?: number;
  paymentDate?: string | null;
  status?: "pending" | "partial" | "paid";
  notes?: string | null;
}

/** PATCH /event-collections/:id — requires `event_collections.update`. */
export function updateEventCollection(
  id: number,
  payload: UpdateEventCollectionPayload
): Promise<BackendEventCollection> {
  return apiFetch<BackendEventCollection>(ENDPOINTS.eventCollections.byId(id), {
    method: "PATCH",
    body: payload,
  });
}

/** DELETE /event-collections/:id — requires `event_collections.delete`. */
export function deleteEventCollection(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.eventCollections.byId(id), { method: "DELETE" });
}
