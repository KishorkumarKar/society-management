"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Pencil, Plus, X, Ban } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { canManage } from "@/lib/data";
import {
  listHallBookings,
  deleteHallBooking,
  approveHallBooking,
  rejectHallBooking,
  cancelHallBooking,
} from "@/lib/api/hallBookings";
import { listFlats } from "@/lib/api/flats";
import type { BackendHallBooking, BackendFlat } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const PAGE_SIZE = 20;
const STATUS_TABS = ["all", "pending", "approved", "rejected", "cancelled"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

function statusTone(status: BackendHallBooking["status"]): "sage" | "brass" | "rust" | "muted" {
  switch (status) {
    case "approved":
      return "sage";
    case "pending":
      return "brass";
    case "rejected":
    case "cancelled":
      return "rust";
    default:
      return "muted";
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError || err instanceof ApiNetworkError ? err.message : fallback;
}

export default function HallBookingsListPage() {
  const { user } = useAuth();
  const canEdit = user ? canManage(user.role) : false;
  const canModerate = user ? ["admin", "super-admin", "committee"].includes(user.role) : false;
  const canCancel = user ? ["admin", "super-admin", "committee", "resident"].includes(user.role) : false;

  const [rows, setRows] = useState<BackendHallBooking[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
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
    listHallBookings({
      page,
      limit: PAGE_SIZE,
      status: statusTab === "all" ? undefined : statusTab,
      sort: "-start_datetime",
    })
      .then((result) => {
        setRows(result.data);
        setTotal(result.pagination.total);
      })
      .catch((err) => setError(errorMessage(err, "Couldn't load hall bookings right now.")));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusTab]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  async function handleDelete(target: BackendHallBooking) {
    try {
      await deleteHallBooking(target.id);
      setRows((prev) => (prev ? prev.filter((b) => b.id !== target.id) : prev));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setError(errorMessage(err, "Couldn't delete this booking."));
    }
  }

  async function handleTransition(target: BackendHallBooking, action: "approve" | "reject" | "cancel") {
    setError(null);
    setBusyId(target.id);
    try {
      const fn = action === "approve" ? approveHallBooking : action === "reject" ? rejectHallBooking : cancelHallBooking;
      const updated = await fn(target.id);
      setRows((prev) => (prev ? prev.map((b) => (b.id === updated.id ? updated : b)) : prev));
    } catch (err) {
      setError(errorMessage(err, `Couldn't ${action} this booking.`));
    } finally {
      setBusyId(null);
    }
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Hall bookings"
        description="Requests to use shared spaces in your society."
        action={
          <Button href="/admin/dashboard/hall-bookings/new" variant="primary">
            <Plus size={16} strokeWidth={2} />
            Add booking
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
              <th className="px-5 py-3 font-medium">Hall</th>
              <th className="px-5 py-3 font-medium">Flat</th>
              <th className="px-5 py-3 font-medium">When</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows === null && !error && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/40">
                  Loading bookings…
                </td>
              </tr>
            )}
            {rows !== null && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/40">
                  No bookings found.
                </td>
              </tr>
            )}
            {rows?.map((booking) => {
              const flat = flatsById.get(booking.flat_id);
              const isBusy = busyId === booking.id;
              return (
                <tr key={booking.id} className="transition-colors hover:bg-ink/[0.02]">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-ink">{booking.hall_name}</span>
                      {booking.purpose && <span className="text-xs text-ink/40">{booking.purpose}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-ink/60">
                    {flat ? `${flat.block} · ${flat.unit_no}` : `#${booking.flat_id}`}
                  </td>
                  <td className="px-5 py-4 text-ink/60">
                    <div className="flex flex-col text-xs">
                      <span>{formatDateTime(booking.start_datetime)}</span>
                      <span className="text-ink/40">→ {formatDateTime(booking.end_datetime)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={statusTone(booking.status)}>{booking.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-ink/60">₹{Number(booking.amount).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {canModerate && booking.status === "pending" && (
                        <>
                          <button
                            type="button"
                            aria-label="Approve"
                            disabled={isBusy}
                            onClick={() => handleTransition(booking, "approve")}
                            className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-sage hover:text-sage disabled:opacity-40"
                          >
                            <Check size={15} strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            aria-label="Reject"
                            disabled={isBusy}
                            onClick={() => handleTransition(booking, "reject")}
                            className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-rust hover:text-rust disabled:opacity-40"
                          >
                            <X size={15} strokeWidth={1.75} />
                          </button>
                        </>
                      )}
                      {canCancel && (booking.status === "pending" || booking.status === "approved") && (
                        <button
                          type="button"
                          aria-label="Cancel"
                          disabled={isBusy}
                          onClick={() => handleTransition(booking, "cancel")}
                          className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-rust hover:text-rust disabled:opacity-40"
                        >
                          <Ban size={15} strokeWidth={1.75} />
                        </button>
                      )}
                      {canEdit && (
                        <>
                          <Link
                            href={`/admin/dashboard/hall-bookings/${booking.id}/edit`}
                            aria-label={`Edit ${booking.hall_name} booking`}
                            className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                          >
                            <Pencil size={15} strokeWidth={1.75} />
                          </Link>
                          <ConfirmDeleteButton
                            label={`the ${booking.hall_name} booking`}
                            onConfirm={() => handleDelete(booking)}
                          />
                        </>
                      )}
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
            Page {page} of {totalPages} · {total} booking{total === 1 ? "" : "s"}
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
