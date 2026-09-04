"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Eye, Pencil, Plus, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { canManage } from "@/lib/data";
import { listEventCollections, deleteEventCollection } from "@/lib/api/eventCollections";
import type { BackendEventCollection } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";

const STATUS_FILTERS = ["all", "paid", "partial", "pending"] as const;

function statusTone(status: BackendEventCollection["status"]): "sage" | "brass" | "rust" | "muted" {
  switch (status) {
    case "paid":
      return "sage";
    case "partial":
      return "brass";
    case "pending":
      return "rust";
    default:
      return "muted";
  }
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError || err instanceof ApiNetworkError ? err.message : fallback;
}

/** This tab fetches only this event's collections — opened lazily, not
 *  loaded alongside the Details or Expenses tabs. */
export default function EventCollectionsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? Number(params.id) : NaN;
  const { user } = useAuth();
  const isManager = !!user && canManage(user.role);

  const [rows, setRows] = useState<BackendEventCollection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    listEventCollections({ eventId: id, limit: 200 })
      .then((res) => setRows(res.data))
      .catch((err) => setError(errorMessage(err, "Couldn't load collections right now.")));
  }, [id]);

  const totalDue = (rows ?? []).reduce((sum, c) => sum + Number(c.amount_due), 0);
  const totalPaid = (rows ?? []).reduce((sum, c) => sum + Number(c.amount_paid), 0);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (rows ?? []).filter((c) => {
      const matchesStatus = status === "all" || c.status === status;
      const matchesSearch =
        !query || c.member_name.toLowerCase().includes(query) || c.unit.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [rows, search, status]);

  async function handleDelete(target: BackendEventCollection) {
    try {
      await deleteEventCollection(target.id);
      setRows((prev) => (prev ? prev.filter((c) => c.id !== target.id) : prev));
    } catch (err) {
      setError(errorMessage(err, "Couldn't delete this collection entry."));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-ink/50">
          ₹{totalPaid.toLocaleString("en-IN")} collected of ₹{totalDue.toLocaleString("en-IN")} due across{" "}
          {(rows ?? []).length} member{(rows ?? []).length === 1 ? "" : "s"}.
        </p>
        {isManager && (
          <Button href={`/admin/dashboard/events/${id}/collections/new`} variant="primary">
            <Plus size={16} strokeWidth={2} />
            Add collection
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
            placeholder="Search by member or unit"
            className="w-full rounded-sm border border-ink/15 bg-paper py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-ink/30 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as (typeof STATUS_FILTERS)[number])}
          className="rounded-sm border border-ink/15 bg-paper px-4 py-2.5 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Member</th>
              <th className="px-5 py-3 font-medium">Unit</th>
              <th className="px-5 py-3 font-medium">Due</th>
              <th className="px-5 py-3 font-medium">Paid</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows === null && !error && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink/40">
                  Loading collections…
                </td>
              </tr>
            )}
            {rows !== null && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink/40">
                  {rows.length === 0 ? "No collections recorded for this event yet." : "No collections match your filters."}
                </td>
              </tr>
            )}
            {filtered.map((collection) => (
              <tr key={collection.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-4 font-medium text-ink">{collection.member_name}</td>
                <td className="px-5 py-4 text-ink/60">{collection.unit}</td>
                <td className="px-5 py-4 text-ink/60">₹{Number(collection.amount_due).toLocaleString("en-IN")}</td>
                <td className="px-5 py-4 text-ink/60">₹{Number(collection.amount_paid).toLocaleString("en-IN")}</td>
                <td className="px-5 py-4">
                  <Badge tone={statusTone(collection.status)}>{collection.status}</Badge>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">{collection.payment_date || "—"}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/dashboard/events/${id}/collections/${collection.id}`}
                      aria-label={`View ${collection.member_name}'s collection`}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                    >
                      <Eye size={15} strokeWidth={1.75} />
                    </Link>
                    {isManager && (
                      <>
                        <Link
                          href={`/admin/dashboard/events/${id}/collections/${collection.id}/edit`}
                          aria-label={`Edit ${collection.member_name}'s collection`}
                          className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                        >
                          <Pencil size={15} strokeWidth={1.75} />
                        </Link>
                        <ConfirmDeleteButton
                          label={`${collection.member_name}'s collection entry`}
                          onConfirm={() => handleDelete(collection)}
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
