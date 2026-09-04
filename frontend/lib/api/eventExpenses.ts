import { apiFetch, apiFetchList, type ApiListResult } from "@/lib/api/http";
import { ENDPOINTS } from "@/lib/api/endpoints";
import type { BackendEventExpense } from "@/lib/api/types";

/** Spend tied to a specific event's budget — distinct from society-wide
 *  /expenses. */
export interface ListEventExpensesQuery {
  page?: number;
  limit?: number;
  search?: string;
  eventId?: number;
  category?: string;
  fromDate?: string;
  toDate?: string;
  sort?: "date" | "-date" | "created_at" | "-created_at";
}

/** GET /event-expenses — requires `event_expenses.view`. */
export function listEventExpenses(
  query: ListEventExpensesQuery = {}
): Promise<ApiListResult<BackendEventExpense>> {
  return apiFetchList<BackendEventExpense>(ENDPOINTS.eventExpenses.list, { query: { ...query } });
}

export function getEventExpense(id: number): Promise<BackendEventExpense> {
  return apiFetch<BackendEventExpense>(ENDPOINTS.eventExpenses.byId(id));
}

/** Matches createEventExpenseSchema. Note the request field is `date`,
 *  but the entity/response field is `expense_date` — the backend renames
 *  it on the way in. */
export interface CreateEventExpensePayload {
  eventId: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  paidTo?: string | null;
  notes?: string | null;
}

/** POST /event-expenses — requires `event_expenses.create`. */
export function createEventExpense(payload: CreateEventExpensePayload): Promise<BackendEventExpense> {
  return apiFetch<BackendEventExpense>(ENDPOINTS.eventExpenses.list, { method: "POST", body: payload });
}

export interface UpdateEventExpensePayload {
  title?: string;
  category?: string;
  amount?: number;
  date?: string;
  paidTo?: string | null;
  notes?: string | null;
}

/** PATCH /event-expenses/:id — requires `event_expenses.update`. */
export function updateEventExpense(
  id: number,
  payload: UpdateEventExpensePayload
): Promise<BackendEventExpense> {
  return apiFetch<BackendEventExpense>(ENDPOINTS.eventExpenses.byId(id), {
    method: "PATCH",
    body: payload,
  });
}

/** DELETE /event-expenses/:id — requires `event_expenses.delete`. */
export function deleteEventExpense(id: number): Promise<void> {
  return apiFetch<void>(ENDPOINTS.eventExpenses.byId(id), { method: "DELETE" });
}
