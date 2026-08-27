import { apiClient } from '../client';
import { ApiPaginated, ApiSuccess, Announcement, AnnouncementPriority } from '../types';

// backend/src/modules/announcements/announcements.controller.ts +
// announcements.service.ts (CreateAnnouncementInput/UpdateAnnouncementInput).
// Request bodies are camelCase; response is the raw Announcement entity
// spread with targetRoleIds (see api/types.ts). Sending is POST .../send,
// which sets sent_at server-side — there's no separate "is sent" flag to set.
// permissions: announcements.view / .create / .update / .delete / .send

export async function listAnnouncements(params: { page?: number; limit?: number; priority?: AnnouncementPriority } = {}) {
  const res = await apiClient.get<ApiPaginated<Announcement>>('/announcements', { params });
  return res.data;
}

export async function getAnnouncement(id: number) {
  const res = await apiClient.get<ApiSuccess<Announcement>>(`/announcements/${id}`);
  return res.data.data;
}

export interface CreateAnnouncementPayload {
  title: string;
  body: string;
  priority?: AnnouncementPriority;
  /** Empty/omitted = society-wide. Otherwise, an explicit list of role IDs. */
  targetRoleIds?: number[];
}

export async function createAnnouncement(payload: CreateAnnouncementPayload) {
  const res = await apiClient.post<ApiSuccess<Announcement>>('/announcements', payload);
  return res.data.data;
}

export async function updateAnnouncement(id: number, payload: Partial<CreateAnnouncementPayload>) {
  const res = await apiClient.patch<ApiSuccess<Announcement>>(`/announcements/${id}`, payload);
  return res.data.data;
}

export async function deleteAnnouncement(id: number) {
  await apiClient.delete(`/announcements/${id}`);
}

export async function sendAnnouncement(id: number) {
  const res = await apiClient.post<ApiSuccess<Announcement>>(`/announcements/${id}/send`);
  return res.data.data;
}
