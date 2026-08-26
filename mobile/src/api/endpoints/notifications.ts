import { apiClient } from '../client';
import { ApiPaginated, ApiSuccess, AppNotification } from '../types';

// backend/src/modules/notifications/notification.controller.ts:
//   POST /notifications  GET /notifications  PATCH /notifications/read-all
//   GET /notifications/:id  PATCH /notifications/:id  DELETE /notifications/:id
//   PATCH /notifications/:id/read
// permissions: notifications.view (own) / .view_all (others in society) / .create / .send / .mark_read / .delete

export async function listNotifications(params: { page?: number; limit?: number; unreadOnly?: boolean } = {}) {
  const res = await apiClient.get<ApiPaginated<AppNotification>>('/notifications', { params });
  return res.data;
}
export async function markRead(id: number) {
  const res = await apiClient.patch<ApiSuccess<AppNotification>>(`/notifications/${id}/read`);
  return res.data.data;
}
export async function markAllRead() {
  await apiClient.patch('/notifications/read-all');
}
export async function deleteNotification(id: number) {
  await apiClient.delete(`/notifications/${id}`);
}
