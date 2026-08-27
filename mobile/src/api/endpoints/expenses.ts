import { apiClient } from '../client';
import { ApiPaginated, ApiSuccess, Expense, ExpenseStatus } from '../types';

// backend/src/modules/expenses/expenses.controller.ts + expenses.service.ts
// (CreateExpenseInput/UpdateExpenseInput). Request body is camelCase;
// response is the raw Expense entity (snake_case).
// permissions: expenses.view / .create / .update / .delete / .approve

export async function listExpenses(params: { page?: number; limit?: number; status?: ExpenseStatus; category?: string } = {}) {
  const res = await apiClient.get<ApiPaginated<Expense>>('/expenses', { params });
  return res.data;
}

export async function getExpense(id: number) {
  const res = await apiClient.get<ApiSuccess<Expense>>(`/expenses/${id}`);
  return res.data.data;
}

export interface CreateExpensePayload {
  category: string;
  vendorName?: string | null;
  amount: number;
  expenseDate: string; // ISO date
  receiptUrl?: string | null;
  description?: string | null;
}

export async function createExpense(payload: CreateExpensePayload) {
  const res = await apiClient.post<ApiSuccess<Expense>>('/expenses', payload);
  return res.data.data;
}

export async function updateExpense(id: number, payload: Partial<CreateExpensePayload>) {
  const res = await apiClient.patch<ApiSuccess<Expense>>(`/expenses/${id}`, payload);
  return res.data.data;
}

export async function deleteExpense(id: number) {
  await apiClient.delete(`/expenses/${id}`);
}

/** approved_by/approved_at are always server-derived from the caller — never sent by the client. */
export async function decideExpense(id: number, decision: 'approved' | 'rejected') {
  const res = await apiClient.patch<ApiSuccess<Expense>>(`/expenses/${id}/approve`, { decision });
  return res.data.data;
}
