import { apiClient } from '../client';
import { ApiPaginated, ApiSuccess, Announcement } from '../types';

// backend/src/modules/announcements/announcements.controller.ts:
//   POST   /announcements          (announcements.create)
//   GET    /announcements          (announcements.view)
//   GET    /announcements/:id      (announcements.view)
//   PATCH  /announcements/:id      (announcements.update)
//   DELETE /announcements/:id      (announcements.delete)
//   POST   /announcements/:id/send (announcements.send)

export async function listAnnouncements(params: { page?: number; limit?: number } = {}) {
  const res = await apiClient.get<ApiPaginated<Announcement>>('/announcements', { params });
  return res.data;
}

export async function getAnnouncement(id: number) {
  const res = await apiClient.get<ApiSuccess<Announcement>>(`/announcements/${id}`);
  return res.data.data;
}

export async function createAnnouncement(payload: { title: string; body: string }) {
  const res = await apiClient.post<ApiSuccess<Announcement>>('/announcements', payload);
  return res.data.data;
}

export async function updateAnnouncement(id: number, payload: Partial<{ title: string; body: string }>) {
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
