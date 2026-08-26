import { apiClient } from '../client';
import { ApiPaginated, ApiSuccess, Expense } from '../types';

// backend/src/modules/expenses/expenses.controller.ts:
//   POST /expenses  GET /expenses  GET /expenses/:id  PATCH /expenses/:id
//   DELETE /expenses/:id  PATCH /expenses/:id/approve
// permissions: expenses.view / .create / .update / .delete / .approve

export async function listExpenses(params: { page?: number; limit?: number; status?: string } = {}) {
  const res = await apiClient.get<ApiPaginated<Expense>>('/expenses', { params });
  return res.data;
}
export async function getExpense(id: number) {
  const res = await apiClient.get<ApiSuccess<Expense>>(`/expenses/${id}`);
  return res.data.data;
}
export async function createExpense(payload: { category: string; amount: number; description?: string; incurred_on: string }) {
  const res = await apiClient.post<ApiSuccess<Expense>>('/expenses', payload);
  return res.data.data;
}
export async function updateExpense(id: number, payload: Partial<{ category: string; amount: number; description: string }>) {
  const res = await apiClient.patch<ApiSuccess<Expense>>(`/expenses/${id}`, payload);
  return res.data.data;
}
export async function deleteExpense(id: number) {
  await apiClient.delete(`/expenses/${id}`);
}
export async function approveExpense(id: number) {
  const res = await apiClient.patch<ApiSuccess<Expense>>(`/expenses/${id}/approve`);
  return res.data.data;
}
