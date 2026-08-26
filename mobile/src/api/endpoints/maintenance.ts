import { apiClient } from '../client';
import { ApiPaginated, ApiSuccess, MaintenanceBill, MaintenancePayment } from '../types';

// backend/src/modules/maintenance/maintenance.controller.ts:
//   POST   /maintenance-bills                 (maintenance.create)
//   GET    /maintenance-bills                 (maintenance.view)
//   GET    /maintenance-bills/:id              (maintenance.view)
//   PATCH  /maintenance-bills/:id              (maintenance.update)
//   DELETE /maintenance-bills/:id              (maintenance.delete)
//   POST   /maintenance-bills/:id/payments     (maintenance.collect)
//   GET    /maintenance-bills/:id/payments     (maintenance.view)

export interface ListMaintenanceParams {
  page?: number;
  limit?: number;
  status?: MaintenanceBill['status'];
  flatId?: number;
}

export async function listMaintenanceBills(params: ListMaintenanceParams = {}) {
  const res = await apiClient.get<ApiPaginated<MaintenanceBill>>('/maintenance-bills', { params });
  return res.data;
}

export async function getMaintenanceBill(id: number) {
  const res = await apiClient.get<ApiSuccess<MaintenanceBill>>(`/maintenance-bills/${id}`);
  return res.data.data;
}

export interface CreateMaintenanceBillPayload {
  flat_id: number;
  period: string;
  amount: number;
  due_date: string;
}

export async function createMaintenanceBill(payload: CreateMaintenanceBillPayload) {
  const res = await apiClient.post<ApiSuccess<MaintenanceBill>>('/maintenance-bills', payload);
  return res.data.data;
}

export async function updateMaintenanceBill(id: number, payload: Partial<CreateMaintenanceBillPayload>) {
  const res = await apiClient.patch<ApiSuccess<MaintenanceBill>>(`/maintenance-bills/${id}`, payload);
  return res.data.data;
}

export async function deleteMaintenanceBill(id: number) {
  await apiClient.delete(`/maintenance-bills/${id}`);
}

export async function listPayments(billId: number) {
  const res = await apiClient.get<ApiSuccess<MaintenancePayment[]>>(`/maintenance-bills/${billId}/payments`);
  return res.data.data;
}

export async function recordPayment(billId: number, payload: { amount: number; method?: string }) {
  const res = await apiClient.post<ApiSuccess<MaintenancePayment>>(`/maintenance-bills/${billId}/payments`, payload);
  return res.data.data;
}
