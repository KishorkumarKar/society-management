import { apiClient } from '../client';
import { ApiPaginated, ApiSuccess, MaintenanceBill, MaintenanceBillStatus, MaintenancePayment, PaymentMethod } from '../types';

// backend/src/modules/maintenance/maintenance.controller.ts +
// maintenance.service.ts (CreateBillInput/UpdateBillInput/CreatePaymentInput).
// Request bodies are camelCase; GET responses merge the raw MaintenanceBill
// entity with computed totalPaid/outstanding (see MaintenanceBill's comment
// in api/types.ts) — that merge is real backend behavior, not a client-side
// convenience. permissions: maintenance.view / .create / .update / .delete / .collect

export interface ListMaintenanceParams {
  page?: number;
  limit?: number;
  status?: MaintenanceBillStatus;
  flatId?: number;
  billingYear?: number;
  billingMonth?: number;
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
  flatId: number;
  billingYear: number;
  billingMonth: number; // 1-12
  amount: number;
  dueDate: string; // ISO date
  penalty?: number;
}

export async function createMaintenanceBill(payload: CreateMaintenanceBillPayload) {
  const res = await apiClient.post<ApiSuccess<MaintenanceBill>>('/maintenance-bills', payload);
  return res.data.data;
}

export interface UpdateMaintenanceBillPayload {
  amount?: number;
  dueDate?: string;
  status?: MaintenanceBillStatus;
  penalty?: number;
}

export async function updateMaintenanceBill(id: number, payload: UpdateMaintenanceBillPayload) {
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

export interface RecordPaymentPayload {
  amount: number;
  paymentDate: string; // ISO date
  paymentMethod: PaymentMethod;
  transactionId?: string | null;
}

export async function recordPayment(billId: number, payload: RecordPaymentPayload) {
  const res = await apiClient.post<ApiSuccess<MaintenancePayment>>(`/maintenance-bills/${billId}/payments`, payload);
  return res.data.data;
}
