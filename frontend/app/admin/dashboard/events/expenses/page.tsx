"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { findSocietyById, eventsBySociety } from "@/lib/data";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import RequireRole from "@/components/admin/RequireRole";

function AllExpensesContent() {
  const { user } = useAuth();
  const { events, expenses, societies } = useData();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [eventId, setEventId] = useState("all");

  if (!user) return null;

  const isSuperAdmin = user.role === "super-admin";
  const scopedEvents = isSuperAdmin ? events : eventsBySociety(events, user.societyId);
  const scopedEventIds = new Set(scopedEvents.map((e) => e.id));

  function eventName(id: string): string {
    return events.find((e) => e.id === id)?.name ?? "—";
  }

  const allRows = [...expenses]
    .filter((e) => scopedEventIds.has(e.eventId))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const categories = useMemo(() => Array.from(new Set(allRows.map((e) => e.category))).sort(), [allRows]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allRows.filter((e) => {
      const matchesEvent = eventId === "all" || e.eventId === eventId;
      const matchesCategory = category === "all" || e.category === category;
      const matchesSearch =
        !query ||
        e.title.toLowerCase().includes(query) ||
        e.paidTo.toLowerCase().includes(query);
      return matchesEvent && matchesCategory && matchesSearch;
    });
  }, [allRows, search, category, eventId]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Expenses"
        description="Every expense recorded across all events. Open an event to add or edit line items."
      />

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
          {scopedEvents.map((event) => (
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
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Event</th>
              {isSuperAdmin && <th className="px-5 py-3 font-medium">Society</th>}
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Paid to</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.length === 0 && (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} className="px-5 py-10 text-center text-ink/40">
                  {allRows.length === 0 ? "No expenses yet." : "No expenses match your filters."}
                </td>
              </tr>
            )}
            {rows.map((expense) => (
              <tr key={expense.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-4 font-medium text-ink">{expense.title}</td>
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/dashboard/events/${expense.eventId}/expenses`}
                    className="text-ink/70 hover:text-brass"
                  >
                    {eventName(expense.eventId)}
                  </Link>
                </td>
                {isSuperAdmin && (
                  <td className="px-5 py-4 text-ink/60">
                    {findSocietyById(societies, expense.societyId)?.name ?? "—"}
                  </td>
                )}
                <td className="px-5 py-4">
                  <Badge tone="muted">{expense.category}</Badge>
                </td>
                <td className="px-5 py-4 text-ink/60">{expense.paidTo || "—"}</td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">{expense.date}</td>
                <td className="px-5 py-4 text-right text-ink/60">₹{expense.amount.toLocaleString("en-IN")}</td>
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
