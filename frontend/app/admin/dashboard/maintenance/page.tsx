"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { listMaintenanceBills, deleteMaintenanceBill } from "@/lib/api/maintenance";
import { listFlats } from "@/lib/api/flats";
import type { BackendMaintenanceBill, BackendFlat } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const PAGE_SIZE = 20;
const STATUS_TABS = ["all", "due", "overdue", "paid", "approved"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

function statusTone(status: BackendMaintenanceBill["status"]): "sage" | "brass" | "rust" | "muted" {
  switch (status) {
    case "paid":
    case "approved":
      return "sage";
    case "due":
      return "brass";
    case "overdue":
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

function MaintenanceListContent() {
  const [rows, setRows] = useState<BackendMaintenanceBill[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [error, setError] = useState<string | null>(null);
  const [flatsById, setFlatsById] = useState<Map<number, BackendFlat>>(new Map());

  useEffect(() => {
    listFlats({ limit: 100 })
      .then((res) => setFlatsById(new Map(res.data.map((f) => [f.id, f]))))
      .catch(() => {
        // Flat labels are a nice-to-have; fall back to the raw id.
      });
  }, []);

  function refresh() {
    setError(null);
    listMaintenanceBills({
      page,
      limit: PAGE_SIZE,
      status: statusTab === "all" ? undefined : statusTab,
      sort: "-due_date",
    })
      .then((result) => {
        setRows(result.data);
        setTotal(result.pagination.total);
      })
      .catch((err) => setError(errorMessage(err, "Couldn't load maintenance bills right now.")));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusTab]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  async function handleDelete(target: BackendMaintenanceBill) {
    try {
      await deleteMaintenanceBill(target.id);
      setRows((prev) => (prev ? prev.filter((b) => b.id !== target.id) : prev));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setError(errorMessage(err, "Couldn't delete this bill."));
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Maintenance"
        description="Monthly maintenance bills per flat. Open a bill to record a payment against it."
        action={
          <Button href="/admin/dashboard/maintenance/new" variant="primary">
            <Plus size={16} strokeWidth={2} />
            Add bill
          </Button>
        }
      />

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

      {error && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Flat</th>
              <th className="px-5 py-3 font-medium">Period</th>
              <th className="px-5 py-3 font-medium">Due</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Outstanding</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows === null && !error && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink/40">
                  Loading bills…
                </td>
              </tr>
            )}
            {rows !== null && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink/40">
                  No bills found.
                </td>
              </tr>
            )}
            {rows?.map((bill) => {
              const flat = flatsById.get(bill.flat_id);
              return (
                <tr key={bill.id} className="transition-colors hover:bg-ink/[0.02]">
                  <td className="px-5 py-4 font-medium text-ink">
                    {flat ? `${flat.block} · ${flat.unit_no}` : `#${bill.flat_id}`}
                  </td>
                  <td className="px-5 py-4 text-ink/60">
                    {String(bill.billing_month).padStart(2, "0")}/{bill.billing_year}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-ink/50">{bill.due_date}</td>
                  <td className="px-5 py-4 text-ink/60">{money(bill.amount)}</td>
                  <td className="px-5 py-4 text-ink/60">
                    {bill.outstanding > 0 ? money(bill.outstanding) : "Settled"}
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={statusTone(bill.status)}>{bill.status}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/dashboard/maintenance/${bill.id}/edit`}
                        aria-label={`Edit bill for ${flat ? flat.unit_no : bill.flat_id}`}
                        className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                      >
                        <Pencil size={15} strokeWidth={1.75} />
                      </Link>
                      <ConfirmDeleteButton
                        label={`the ${bill.billing_month}/${bill.billing_year} bill`}
                        onConfirm={() => handleDelete(bill)}
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
            Page {page} of {totalPages} · {total} bill{total === 1 ? "" : "s"}
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

export default function MaintenanceListPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <MaintenanceListContent />
    </RequireRole>
  );
}
