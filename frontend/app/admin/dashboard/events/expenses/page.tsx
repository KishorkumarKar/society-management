"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { listEventExpenses } from "@/lib/api/eventExpenses";
import { listEvents } from "@/lib/api/events";
import type { BackendEventExpense, BackendEvent } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import RequireRole from "@/components/admin/RequireRole";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError || err instanceof ApiNetworkError ? err.message : fallback;
}

/** Rolls up spend across every event in the caller's society —
 *  `GET /event-expenses` without an `eventId` filter returns exactly
 *  that (tenant-isolated, same as everything else). */
function AllExpensesContent() {
  const [rows, setRows] = useState<BackendEventExpense[] | null>(null);
  const [events, setEvents] = useState<Map<number, BackendEvent>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [eventId, setEventId] = useState("all");

  useEffect(() => {
    listEventExpenses({ limit: 200, sort: "-date" })
      .then((res) => setRows(res.data))
      .catch((err) => setError(errorMessage(err, "Couldn't load expenses right now.")));
    listEvents({ limit: 100 })
      .then((res) => setEvents(new Map(res.data.map((e) => [e.id, e]))))
      .catch(() => {
        // Event names are a nice-to-have here; falls back to the raw id.
      });
  }, []);

  const categories = useMemo(() => Array.from(new Set((rows ?? []).map((e) => e.category))).sort(), [rows]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (rows ?? []).filter((e) => {
      const matchesEvent = eventId === "all" || e.event_id === Number(eventId);
      const matchesCategory = category === "all" || e.category === category;
      const matchesSearch =
        !query || e.title.toLowerCase().includes(query) || (e.paid_to ?? "").toLowerCase().includes(query);
      return matchesEvent && matchesCategory && matchesSearch;
    });
  }, [rows, search, category, eventId]);

  const totalSpent = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Expenses" description="Every line item across all of your society's events." />

      {error && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <p className="text-sm text-ink/50">
        ₹{totalSpent.toLocaleString("en-IN")} spent across {filtered.length} line item
        {filtered.length === 1 ? "" : "s"}.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or paid to"
            className="w-full rounded-sm border border-ink/15 bg-paper py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-ink/30 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
        </div>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="rounded-sm border border-ink/15 bg-paper px-4 py-2.5 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        >
          <option value="all">All events</option>
          {[...events.values()].map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-sm border border-ink/15 bg-paper px-4 py-2.5 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Event</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Paid to</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows === null && !error && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/40">
                  Loading expenses…
                </td>
              </tr>
            )}
            {rows !== null && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/40">
                  No expenses match your filters.
                </td>
              </tr>
            )}
            {filtered.map((expense) => (
              <tr key={expense.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-4 font-medium text-ink">
                  <Link
                    href={`/admin/dashboard/events/${expense.event_id}/expenses/${expense.id}`}
                    className="hover:text-brass"
                  >
                    {expense.title}
                  </Link>
                </td>
                <td className="px-5 py-4 text-ink/60">{events.get(expense.event_id)?.name ?? `#${expense.event_id}`}</td>
                <td className="px-5 py-4">
                  <Badge tone="muted">{expense.category}</Badge>
                </td>
                <td className="px-5 py-4 text-ink/60">{expense.paid_to || "—"}</td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">{expense.expense_date}</td>
                <td className="px-5 py-4 text-right text-ink/60">₹{Number(expense.amount).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default function AllExpensesPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <AllExpensesContent />
    </RequireRole>
  );
}
