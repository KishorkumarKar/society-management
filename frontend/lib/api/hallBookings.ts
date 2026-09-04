import { apiFetch, apiFetchList, type ApiListResult } from "@/lib/api/http";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { BackendHallBooking } from "@/lib/api/types";

export interface ListHallBookingsQuery {
  page?: number;
  limit?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
  status?: "pending" | "approved" | "rejected" | "cancelled";
  hallName?: string;
  flatId?: number;
  sort?: "start_datetime" | "-start_datetime" | "created_at" | "-created_at";
}

/** GET /hall-bookings — requires `hall_bookings.view`; tenant-isolated,
 *  no cross-society bypass (not even for Super Admin). */
export function listHallBookings(
  query: ListHallBookingsQuery = {}
): Promise<ApiListResult<BackendHallBooking>> {
  return apiFetchList<BackendHallBooking>(ENDPOINTS.hallBookings.list, { query: { ...query } });
}

export function getHallBooking(id: number): Promise<BackendHallBooking> {
  return apiFetch<BackendHallBooking>(ENDPOINTS.hallBookings.byId(id));
}

/** Matches createHallBookingSchema — `endDateTime` must be strictly after
 *  `startDateTime` (enforced by the backend; validate client-side too for
 *  a faster error). New bookings always start `pending`. */
export interface CreateHallBookingPayload {
  flatId: number;
  hallName: string;
  startDateTime: string;
  endDateTime: string;
  purpose?: string | null;
  amount?: number;
  deposit?: number;
}

/** POST /hall-bookings — requires `hall_bookings.create`. */
export function createHallBooking(payload: CreateHallBookingPayload): Promise<BackendHallBooking> {
  return apiFetch<BackendHallBooking>(ENDPOINTS.hallBookings.list, { method: "POST", body: payload });
}

export interface UpdateHallBookingPayload {
  hallName?: string;
  startDateTime?: string;
  endDateTime?: string;
  purpose?: string | null;
  amount?: number;
  deposit?: number;
}

/** PATCH /hall-bookings/:id — requires `hall_bookings.update`. Does NOT
 *  change status — use approve/reject/cancel below for that. */
export function updateHallBooking(
  id: number,
  payload: UpdateHallBookingPayload
): Promise<BackendHallBooking> {
  return apiFetch<BackendHallBooking>(ENDPOINTS.hallBookings.byId(id), {
    method: "PATCH",
    body: payload,
  });
}

/** DELETE /hall-bookings/:id — requires `hall_bookings.delete`. */
export function deleteHallBooking(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.hallBookings.byId(id), { method: "DELETE" });
}

/** PATCH /hall-bookings/:id/approve — requires `hall_bookings.approve`.
 *  No body. Only valid from `pending`. */
export function approveHallBooking(id: number): Promise<BackendHallBooking> {
  return apiFetch<BackendHallBooking>(ENDPOINTS.hallBookings.approve(id), { method: "PATCH" });
}

/** PATCH /hall-bookings/:id/reject — requires `hall_bookings.reject`. */
export function rejectHallBooking(id: number): Promise<BackendHallBooking> {
  return apiFetch<BackendHallBooking>(ENDPOINTS.hallBookings.reject(id), { method: "PATCH" });
}

/** PATCH /hall-bookings/:id/cancel — requires `hall_bookings.cancel`.
 *  Residents can cancel their own pending/approved bookings; managers can
 *  cancel any. */
export function cancelHallBooking(id: number): Promise<BackendHallBooking> {
  return apiFetch<BackendHallBooking>(ENDPOINTS.hallBookings.cancel(id), { method: "PATCH" });
}
