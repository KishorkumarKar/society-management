import { apiFetch, apiFetchList, type ApiListResult } from "@/lib/api/http";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { BackendAnnouncement } from "@/lib/api/types";

export interface ListAnnouncementsQuery {
  page?: number;
  limit?: number;
  search?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  targetRole?: number;
  fromDate?: string;
  toDate?: string;
  sort?: "created_at" | "-created_at" | "priority" | "-priority";
}

/** GET /announcements — requires `announcements.view`. A user without any
 *  of create/update/delete/send only ever sees announcements targeted at
 *  their own role (or society-wide ones); the backend filters this
 *  server-side, so the frontend doesn't need to replicate that logic. */
export function listAnnouncements(
  query: ListAnnouncementsQuery = {}
): Promise<ApiListResult<BackendAnnouncement>> {
  return apiFetchList<BackendAnnouncement>(ENDPOINTS.announcements.list, { query: { ...query } });
}

export function getAnnouncement(id: number): Promise<BackendAnnouncement> {
  return apiFetch<BackendAnnouncement>(ENDPOINTS.announcements.byId(id));
}

/** Matches createAnnouncementSchema. Empty/omitted `targetRoleIds` means
 *  society-wide; otherwise it's validated server-side against the
 *  caller's own society + global roles. */
export interface CreateAnnouncementPayload {
  title: string;
  body: string;
  priority?: "low" | "normal" | "high" | "urgent";
  targetRoleIds?: number[];
}

/** POST /announcements — requires `announcements.create`. Doesn't notify
 *  anyone by itself — see sendAnnouncement below. */
export function createAnnouncement(payload: CreateAnnouncementPayload): Promise<BackendAnnouncement> {
  return apiFetch<BackendAnnouncement>(ENDPOINTS.announcements.list, { method: "POST", body: payload });
}

export interface UpdateAnnouncementPayload {
  title?: string;
  body?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  targetRoleIds?: number[];
}

export function updateAnnouncement(
  id: number,
  payload: UpdateAnnouncementPayload
): Promise<BackendAnnouncement> {
  return apiFetch<BackendAnnouncement>(ENDPOINTS.announcements.byId(id), { method: "PATCH", body: payload });
}

/** DELETE /announcements/:id — requires `announcements.delete`. */
export function deleteAnnouncement(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.announcements.byId(id), { method: "DELETE" });
}

/** POST /announcements/:id/send — requires `announcements.send`. Creates
 *  one notification per target user and sets `sent_at`; a created-but-
 *  never-sent announcement never reaches anyone's notification feed. */
export function sendAnnouncement(id: number): Promise<BackendAnnouncement> {
  return apiFetch<BackendAnnouncement>(ENDPOINTS.announcements.send(id), { method: "POST" });
}
