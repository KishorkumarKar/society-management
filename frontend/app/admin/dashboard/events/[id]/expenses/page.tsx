"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Eye, Pencil, Plus, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { expensesByEvent, canManage } from "@/lib/data";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";

/** This tab fetches only this event's expenses — opened lazily, not loaded
 *  alongside the Details or Collections tabs. */
export default function EventExpensesPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const { expenses, deleteExpense } = useData();
  const isManager = !!user && canManage(user.role);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const allRows = expensesByEvent(expenses, id);
  const totalSpent = allRows.reduce((sum, e) => sum + e.amount, 0);
  const categories = useMemo(
    () => Array.from(new Set(allRows.map((e) => e.category))).sort(),
    [allRows]
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allRows.filter((e) => {
      const matchesCategory = category === "all" || e.category === category;
      const matchesSearch =
        !query ||
        e.title.toLowerCase().includes(query) ||
        e.paidTo.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [allRows, search, category]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-ink/50">
          ₹{totalSpent.toLocaleString("en-IN")} spent across {allRows.length} line item{allRows.length === 1 ? "" : "s"}.
        </p>
        {isManager && (
          <Button href={`/admin/dashboard/events/${id}/expenses/new`} variant="primary">
            <Plus size={16} strokeWidth={2} />
            Add expense
          </Button>
        )}
      </div>

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
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Paid to</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium text-right">Amount</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/40">
                  {allRows.length === 0
                    ? "No expenses recorded for this event yet."
                    : "No expenses match your filters."}
                </td>
              </tr>
            )}
            {rows.map((expense) => (
              <tr key={expense.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-4 font-medium text-ink">{expense.title}</td>
                <td className="px-5 py-4">
                  <Badge tone="muted">{expense.category}</Badge>
                </td>
                <td className="px-5 py-4 text-ink/60">{expense.paidTo || "—"}</td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">{expense.date}</td>
                <td className="px-5 py-4 text-right text-ink/60">₹{expense.amount.toLocaleString("en-IN")}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/dashboard/events/${id}/expenses/${expense.id}`}
                      aria-label={`View ${expense.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                    >
                      <Eye size={15} strokeWidth={1.75} />
                    </Link>
                    {isManager && (
                      <>
                        <Link
                          href={`/admin/dashboard/events/${id}/expenses/${expense.id}/edit`}
                          aria-label={`Edit ${expense.title}`}
                          className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                        >
                          <Pencil size={15} strokeWidth={1.75} />
                        </Link>
                        <ConfirmDeleteButton
                          label={expense.title}
                          onConfirm={() => deleteExpense(expense.id)}
                        />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
