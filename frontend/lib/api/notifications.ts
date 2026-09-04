import { apiFetch, apiFetchList, type ApiListResult } from "@/lib/api/http";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { BackendNotification } from "@/lib/api/types";

export interface ListNotificationsQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
  /** Only meaningful — and only honored by the backend — for a caller
   *  holding `notifications.view_all`; everyone else always gets just
   *  their own notifications regardless of this. */
  userId?: number;
  sort?: "created_at" | "-created_at";
}

/** GET /notifications — requires `notifications.view`. Scoped to the
 *  caller's own notifications unless they hold
 *  `notifications.view_all`. */
export function listNotifications(
  query: ListNotificationsQuery = {}
): Promise<ApiListResult<BackendNotification>> {
  return apiFetchList<BackendNotification>(ENDPOINTS.notifications.list, { query: { ...query } });
}

export function getNotification(id: number): Promise<BackendNotification> {
  return apiFetch<BackendNotification>(ENDPOINTS.notifications.byId(id));
}

/** Matches createNotificationSchema. Every role that can reach this page
 *  holds `notifications.mark_read`, but `notifications.create` is a
 *  narrower, more administrative permission — sending a notification to
 *  a specific user may 403 for some roles, which is expected. */
export interface CreateNotificationPayload {
  userId: number;
  type: string;
  title: string;
  body?: string | null;
  channel?: "in_app" | "email" | "sms" | "push";
}

export function createNotification(payload: CreateNotificationPayload): Promise<BackendNotification> {
  return apiFetch<BackendNotification>(ENDPOINTS.notifications.list, { method: "POST", body: payload });
}

/** PATCH /notifications/:id — requires `notifications.update`. Only
 *  title/body are editable — not `isRead` (see markNotificationRead
 *  below for that) and not the recipient. */
export function updateNotification(
  id: number,
  payload: { title?: string; body?: string | null }
): Promise<BackendNotification> {
  return apiFetch<BackendNotification>(ENDPOINTS.notifications.byId(id), {
    method: "PATCH",
    body: payload,
  });
}

/** DELETE /notifications/:id — requires `notifications.delete`. */
export function deleteNotification(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.notifications.byId(id), { method: "DELETE" });
}

/** PATCH /notifications/:id/read — requires `notifications.mark_read`. */
export function markNotificationRead(id: number): Promise<BackendNotification> {
  return apiFetch<BackendNotification>(ENDPOINTS.notifications.markRead(id), { method: "PATCH" });
}

/** PATCH /notifications/read-all — requires `notifications.mark_read`.
 *  Marks every one of the caller's own unread notifications as read (not
 *  affected by `view_all` — always just the caller's own). */
export function markAllNotificationsRead(): Promise<{ markedRead: number }> {
  return apiFetch<{ markedRead: number }>(ENDPOINTS.notifications.readAll, { method: "PATCH" });
}
