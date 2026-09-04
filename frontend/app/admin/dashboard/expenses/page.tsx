"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Pencil, Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { listExpenses, deleteExpense, approveExpense } from "@/lib/api/expenses";
import type { BackendExpense } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const PAGE_SIZE = 20;
const STATUS_TABS = ["all", "pending", "approved", "rejected"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

function statusTone(status: BackendExpense["status"]): "sage" | "brass" | "rust" | "muted" {
  switch (status) {
    case "approved":
      return "sage";
    case "pending":
      return "brass";
    case "rejected":
      return "rust";
    default:
      return "muted";
  }
}

function money(value: string | number): string {
  const n = Number(value);
  return Number.isFinite(n) ? `₹${n.toLocaleString("en-IN")}` : "—";
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError || err instanceof ApiNetworkError ? err.message : fallback;
}

function ExpensesListContent() {
  const { user } = useAuth();
  const canApprove = user ? ["admin", "super-admin"].includes(user.role) : false;

  const [rows, setRows] = useState<BackendExpense[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function refresh() {
    setError(null);
    listExpenses({
      page,
      limit: PAGE_SIZE,
      status: statusTab === "all" ? undefined : statusTab,
      sort: "-expense_date",
    })
      .then((result) => {
        setRows(result.data);
        setTotal(result.pagination.total);
      })
      .catch((err) => setError(errorMessage(err, "Couldn't load expenses right now.")));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusTab]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const totalShown = useMemo(
    () => (rows ?? []).reduce((sum, e) => sum + Number(e.amount), 0),
    [rows]
  );

  async function handleDelete(target: BackendExpense) {
    try {
      await deleteExpense(target.id);
      setRows((prev) => (prev ? prev.filter((e) => e.id !== target.id) : prev));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setError(errorMessage(err, "Couldn't delete this expense."));
    }
  }

  async function handleDecision(target: BackendExpense, decision: "approved" | "rejected") {
    setError(null);
    setBusyId(target.id);
    try {
      const updated = await approveExpense(target.id, decision);
      setRows((prev) => (prev ? prev.map((e) => (e.id === updated.id ? updated : e)) : prev));
    } catch (err) {
      setError(errorMessage(err, `Couldn't ${decision === "approved" ? "approve" : "reject"} this expense.`));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Expenses"
        description="General society expenditure — distinct from per-event spend, which lives under Events."
        action={
          <Button href="/admin/dashboard/expenses/new" variant="primary">
            <Plus size={16} strokeWidth={2} />
            Add expense
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setPage(1);
                setStatusTab(tab);
              }}
              className={`rounded-sm border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                statusTab === tab
                  ? "border-brass bg-brass/10 text-brass-dark"
                  : "border-ink/15 text-ink/60 hover:border-ink/30"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {rows !== null && rows.length > 0 && (
          <span className="text-sm text-ink/50">This page: {money(totalShown)}</span>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Vendor</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
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
            {rows !== null && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/40">
                  No expenses found.
                </td>
              </tr>
            )}
            {rows?.map((expense) => {
              const isBusy = busyId === expense.id;
              return (
                <tr key={expense.id} className="transition-colors hover:bg-ink/[0.02]">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-ink">{expense.category}</span>
                      {expense.description && (
                        <span className="max-w-xs truncate text-xs text-ink/40">{expense.description}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-ink/60">{expense.vendor_name || "—"}</td>
                  <td className="px-5 py-4 font-mono text-xs text-ink/50">{expense.expense_date}</td>
                  <td className="px-5 py-4 text-ink/60">{money(expense.amount)}</td>
                  <td className="px-5 py-4">
                    <Badge tone={statusTone(expense.status)}>{expense.status}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {canApprove && expense.status === "pending" && (
                        <>
                          <button
                            type="button"
                            aria-label="Approve"
                            disabled={isBusy}
                            onClick={() => handleDecision(expense, "approved")}
                            className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-sage hover:text-sage disabled:opacity-40"
                          >
                            <Check size={15} strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            aria-label="Reject"
                            disabled={isBusy}
                            onClick={() => handleDecision(expense, "rejected")}
                            className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-rust hover:text-rust disabled:opacity-40"
                          >
                            <X size={15} strokeWidth={1.75} />
                          </button>
                        </>
                      )}
                      <Link
                        href={`/admin/dashboard/expenses/${expense.id}/edit`}
                        aria-label={`Edit ${expense.category} expense`}
                        className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                      >
                        <Pencil size={15} strokeWidth={1.75} />
                      </Link>
                      <ConfirmDeleteButton
                        label={`the ${expense.category} expense`}
                        onConfirm={() => handleDelete(expense)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink/50">
          <span>
            Page {page} of {totalPages} · {total} expense{total === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="!border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="!border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExpensesListPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <ExpensesListContent />
    </RequireRole>
  );
}
