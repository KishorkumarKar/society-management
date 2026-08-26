import { apiClient } from '../client';
import { ApiPaginated, ApiSuccess, Flat } from '../types';

// backend/src/modules/flats/flats.controller.ts:
//   POST /flats  GET /flats  GET /flats/:id  PATCH /flats/:id  DELETE /flats/:id
// permissions: flats.view / flats.create / flats.update / flats.delete

export async function listFlats(params: { page?: number; limit?: number } = {}) {
  const res = await apiClient.get<ApiPaginated<Flat>>('/flats', { params });
  return res.data;
}
export async function getFlat(id: number) {
  const res = await apiClient.get<ApiSuccess<Flat>>(`/flats/${id}`);
  return res.data.data;
}
export async function createFlat(payload: { unit_number: string; block?: string; floor?: number }) {
  const res = await apiClient.post<ApiSuccess<Flat>>('/flats', payload);
  return res.data.data;
}
export async function updateFlat(id: number, payload: Partial<{ unit_number: string; block: string; floor: number; status: string }>) {
  const res = await apiClient.patch<ApiSuccess<Flat>>(`/flats/${id}`, payload);
  return res.data.data;
}
export async function deleteFlat(id: number) {
  await apiClient.delete(`/flats/${id}`);
}
