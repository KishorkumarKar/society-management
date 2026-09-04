import { apiFetch, apiFetchList, type ApiListResult } from "@/lib/api/http";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { BackendMaintenanceBill, BackendMaintenancePayment } from "@/lib/api/types";

export interface ListMaintenanceBillsQuery {
  page?: number;
  limit?: number;
  flatId?: number;
  billingYear?: number;
  billingMonth?: number;
  status?: "due" | "paid" | "overdue" | "approved";
  sort?: "due_date" | "-due_date" | "created_at" | "-created_at";
}

/** GET /maintenance-bills — requires `maintenance.view`; tenant-isolated,
 *  no cross-society bypass. */
export function listMaintenanceBills(
  query: ListMaintenanceBillsQuery = {}
): Promise<ApiListResult<BackendMaintenanceBill>> {
  return apiFetchList<BackendMaintenanceBill>(ENDPOINTS.maintenanceBills.list, { query: { ...query } });
}

export function getMaintenanceBill(id: number): Promise<BackendMaintenanceBill> {
  return apiFetch<BackendMaintenanceBill>(ENDPOINTS.maintenanceBills.byId(id));
}

/** Matches createBillSchema. One bill per (flat, billingYear,
 *  billingMonth) — the backend has a unique index on that triple, so a
 *  duplicate is a 409/validation error, not a silent overwrite. */
export interface CreateMaintenanceBillPayload {
  flatId: number;
  billingYear: number;
  billingMonth: number;
  amount: number;
  dueDate: string;
  penalty?: number;
}

/** POST /maintenance-bills — requires `maintenance.create`. */
export function createMaintenanceBill(
  payload: CreateMaintenanceBillPayload
): Promise<BackendMaintenanceBill> {
  return apiFetch<BackendMaintenanceBill>(ENDPOINTS.maintenanceBills.list, {
    method: "POST",
    body: payload,
  });
}

/** Matches updateBillSchema — note there's no `flatId`/`billingYear`/
 *  `billingMonth` here; those are immutable once a bill exists. `status`
 *  is a label the backend lets you set directly, separate from the
 *  amount actually collected (see totalPaid/outstanding on the bill, and
 *  recordPayment below, which is the real source of truth for that). */
export interface UpdateMaintenanceBillPayload {
  amount?: number;
  dueDate?: string;
  status?: "due" | "paid" | "overdue" | "approved";
  penalty?: number;
}

/** PATCH /maintenance-bills/:id — requires `maintenance.update`. */
export function updateMaintenanceBill(
  id: number,
  payload: UpdateMaintenanceBillPayload
): Promise<BackendMaintenanceBill> {
  return apiFetch<BackendMaintenanceBill>(ENDPOINTS.maintenanceBills.byId(id), {
    method: "PATCH",
    body: payload,
  });
}

/** DELETE /maintenance-bills/:id — requires `maintenance.delete`. */
export function deleteMaintenanceBill(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.maintenanceBills.byId(id), { method: "DELETE" });
}

/** Matches createPaymentSchema. */
export interface RecordPaymentPayload {
  amount: number;
  paymentDate: string;
  paymentMethod: "cash" | "cheque" | "upi" | "bank_transfer" | "card" | "other";
  transactionId?: string | null;
}

/** POST /maintenance-bills/:id/payments — requires `maintenance.collect`.
 *  Always recorded as `success` server-side; there's no pending/failed
 *  entry point through this form. */
export function recordMaintenancePayment(
  billId: number,
  payload: RecordPaymentPayload
): Promise<BackendMaintenancePayment> {
  return apiFetch<BackendMaintenancePayment>(ENDPOINTS.maintenanceBills.payments(billId), {
    method: "POST",
    body: payload,
  });
}

/** GET /maintenance-bills/:id/payments — requires `maintenance.view`. */
export function listMaintenancePayments(billId: number): Promise<BackendMaintenancePayment[]> {
  return apiFetch<BackendMaintenancePayment[]>(ENDPOINTS.maintenanceBills.payments(billId));
}
