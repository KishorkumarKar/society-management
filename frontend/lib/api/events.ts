import { apiFetch, apiFetchList, type ApiListResult } from "@/lib/api/http";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { BackendEvent } from "@/lib/api/types";

export interface ListEventsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "upcoming" | "ongoing" | "completed" | "cancelled";
  fromDate?: string;
  toDate?: string;
  sort?: "event_date" | "-event_date" | "created_at" | "-created_at";
}

/** GET /events — requires `events.view`; tenant-isolated to the caller's
 *  own society, no cross-society bypass. */
export function listEvents(query: ListEventsQuery = {}): Promise<ApiListResult<BackendEvent>> {
  return apiFetchList<BackendEvent>(ENDPOINTS.events.list, { query: { ...query } });
}

export function getEvent(id: number): Promise<BackendEvent> {
  return apiFetch<BackendEvent>(ENDPOINTS.events.byId(id));
}

/** Matches createEventSchema exactly. `society_id` / `created_by` are
 *  always derived server-side from the authenticated caller — never send
 *  them. */
export interface CreateEventPayload {
  name: string;
  description?: string | null;
  eventDate: string;
  status?: "upcoming" | "ongoing" | "completed" | "cancelled";
  targetAmount?: number;
}

/** POST /events — requires `events.create`. */
export function createEvent(payload: CreateEventPayload): Promise<BackendEvent> {
  return apiFetch<BackendEvent>(ENDPOINTS.events.list, { method: "POST", body: payload });
}

export interface UpdateEventPayload {
  name?: string;
  description?: string | null;
  eventDate?: string;
  status?: "upcoming" | "ongoing" | "completed" | "cancelled";
  targetAmount?: number;
}

/** PATCH /events/:id — requires `events.update`. */
export function updateEvent(id: number, payload: UpdateEventPayload): Promise<BackendEvent> {
  return apiFetch<BackendEvent>(ENDPOINTS.events.byId(id), { method: "PATCH", body: payload });
}

/** DELETE /events/:id — requires `events.delete`. Soft-delete; also
 *  removes the event's collections/expenses per the backend. */
export function deleteEvent(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.events.byId(id), { method: "DELETE" });
}
