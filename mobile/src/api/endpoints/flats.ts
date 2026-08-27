import { apiClient } from '../client';
import { ApiPaginated, ApiSuccess, Flat } from '../types';

// backend/src/modules/flats/flats.controller.ts + flats.service.ts
// (CreateFlatInput/UpdateFlatInput). Request body is camelCase; response
// is the raw Flat entity (snake_case) — see api/types.ts's header comment.
// permissions: flats.view / .create / .update / .delete

export async function listFlats(params: { page?: number; limit?: number; search?: string; block?: string } = {}) {
  const res = await apiClient.get<ApiPaginated<Flat>>('/flats', { params });
  return res.data;
}

export async function getFlat(id: number) {
  const res = await apiClient.get<ApiSuccess<Flat>>(`/flats/${id}`);
  return res.data.data;
}

export interface CreateFlatPayload {
  block: string;
  floor: string;
  unitNo: string;
  ownerId?: number | null;
  sqft: number;
  pricePerSqft?: number | null;
  fixPrice?: number | null;
}

export async function createFlat(payload: CreateFlatPayload) {
  const res = await apiClient.post<ApiSuccess<Flat>>('/flats', payload);
  return res.data.data;
}

export async function updateFlat(id: number, payload: Partial<CreateFlatPayload>) {
  const res = await apiClient.patch<ApiSuccess<Flat>>(`/flats/${id}`, payload);
  return res.data.data;
}

export async function deleteFlat(id: number) {
  await apiClient.delete(`/flats/${id}`);
}
