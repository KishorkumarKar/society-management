import { apiFetch, apiFetchList, type ApiListResult } from "@/lib/api/http";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { BackendExpense } from "@/lib/api/types";

export interface ListExpensesQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  vendorName?: string;
  fromDate?: string;
  toDate?: string;
  approvedBy?: number;
  status?: "pending" | "approved" | "rejected";
  sort?: "expense_date" | "-expense_date" | "created_at" | "-created_at" | "amount" | "-amount";
}

/** GET /expenses — requires `expenses.view`; tenant-isolated, no
 *  cross-society bypass. Distinct from event-scoped spend
 *  (event-expenses.ts) — this is general society expenditure. */
export function listExpenses(query: ListExpensesQuery = {}): Promise<ApiListResult<BackendExpense>> {
  return apiFetchList<BackendExpense>(ENDPOINTS.expenses.list, { query: { ...query } });
}

export function getExpense(id: number): Promise<BackendExpense> {
  return apiFetch<BackendExpense>(ENDPOINTS.expenses.byId(id));
}

/** Matches createExpenseSchema. New expenses always start `pending` —
 *  approve/reject is a separate action, see approveExpense below. */
export interface CreateExpensePayload {
  category: string;
  vendorName?: string | null;
  amount: number;
  expenseDate: string;
  receiptUrl?: string | null;
  description?: string | null;
}

/** POST /expenses — requires `expenses.create`. */
export function createExpense(payload: CreateExpensePayload): Promise<BackendExpense> {
  return apiFetch<BackendExpense>(ENDPOINTS.expenses.list, { method: "POST", body: payload });
}

export interface UpdateExpensePayload {
  category?: string;
  vendorName?: string | null;
  amount?: number;
  expenseDate?: string;
  receiptUrl?: string | null;
  description?: string | null;
}

/** PATCH /expenses/:id — requires `expenses.update`. Doesn't change
 *  status — use approveExpense below for that. */
export function updateExpense(id: number, payload: UpdateExpensePayload): Promise<BackendExpense> {
  return apiFetch<BackendExpense>(ENDPOINTS.expenses.byId(id), { method: "PATCH", body: payload });
}

/** DELETE /expenses/:id — requires `expenses.delete`. */
export function deleteExpense(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.expenses.byId(id), { method: "DELETE" });
}

/** PATCH /expenses/:id/approve — requires `expenses.approve`.
 *  `approved_by`/`approved_at` are always derived server-side from the
 *  authenticated caller — never sent from the client. */
export function approveExpense(id: number, decision: "approved" | "rejected"): Promise<BackendExpense> {
  return apiFetch<BackendExpense>(ENDPOINTS.expenses.approve(id), {
    method: "PATCH",
    body: { decision },
  });
}
