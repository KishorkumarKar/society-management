import { apiClient } from '../client';
import { ApiPaginated, ApiSuccess, Society } from '../types';

// backend/src/modules/societies/societies.controller.ts:
//   POST /societies  GET /societies  GET /societies/:id  PATCH /societies/:id  DELETE /societies/:id
// permissions: societies.view / .create / .update / .delete
// Note: this is cross-society administration (platform-level), distinct
// from the society context embedded in the logged-in user's own JWT —
// most tenant users will never see permissions for this module.

export async function listSocieties(params: { page?: number; limit?: number } = {}) {
  const res = await apiClient.get<ApiPaginated<Society>>('/societies', { params });
  return res.data;
}
export async function getSociety(id: number) {
  const res = await apiClient.get<ApiSuccess<Society>>(`/societies/${id}`);
  return res.data.data;
}
export async function updateSociety(id: number, payload: Partial<{ name: string; status: string }>) {
  const res = await apiClient.patch<ApiSuccess<Society>>(`/societies/${id}`, payload);
  return res.data.data;
}
