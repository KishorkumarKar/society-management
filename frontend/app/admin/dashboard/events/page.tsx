"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { canManage } from "@/lib/data";
import { listEvents, deleteEvent } from "@/lib/api/events";
import type { BackendEvent } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const PAGE_SIZE = 20;

function statusTone(status: BackendEvent["status"]): "sage" | "brass" | "muted" | "rust" {
  switch (status) {
    case "ongoing":
      return "sage";
    case "upcoming":
      return "brass";
    case "cancelled":
      return "rust";
    default:
      return "muted";
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function EventsListPage() {
  const { user } = useAuth();
  const isManager = user ? canManage(user.role) : false;

  const [rows, setRows] = useState<BackendEvent[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listEvents({ page, limit: PAGE_SIZE, sort: "-event_date" })
      .then((result) => {
        if (cancelled) return;
        setRows(result.data);
        setTotal(result.pagination.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError || err instanceof ApiNetworkError
            ? err.message
            : "Couldn't load events right now."
        );
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  async function handleDelete(target: BackendEvent) {
    try {
      await deleteEvent(target.id);
      setRows((prev) => (prev ? prev.filter((e) => e.id !== target.id) : prev));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't delete this event."
      );
    }
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Events"
        description="Fund-raising and social events for your society. Open an event to track its collections and expenses."
        action={
          isManager ? (
            <Button href="/admin/dashboard/events/new" variant="primary">
              <Plus size={16} strokeWidth={2} />
              Add event
            </Button>
          ) : undefined
        }
      />

      {error && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Event</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Target</th>
              {isManager && <th className="px-5 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows === null && !error && (
              <tr>
                <td colSpan={isManager ? 5 : 4} className="px-5 py-10 text-center text-ink/40">
                  Loading events…
                </td>
              </tr>
            )}
            {rows !== null && rows.length === 0 && (
              <tr>
                <td colSpan={isManager ? 5 : 4} className="px-5 py-10 text-center text-ink/40">
                  No events yet.
                </td>
              </tr>
            )}
            {rows?.map((event) => (
              <tr key={event.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-4 font-medium text-ink">{event.name}</td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">{formatDate(event.event_date)}</td>
                <td className="px-5 py-4">
                  <Badge tone={statusTone(event.status)}>{event.status}</Badge>
                </td>
                <td className="px-5 py-4 text-ink/60">
                  ₹{Number(event.target_amount).toLocaleString("en-IN")}
                </td>
                {isManager && (
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/dashboard/events/${event.id}/edit`}
                        aria-label={`Edit ${event.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                      >
                        <Pencil size={15} strokeWidth={1.75} />
                      </Link>
                      <ConfirmDeleteButton
                        label={`${event.name} (and its collections & expenses)`}
                        onConfirm={() => handleDelete(event)}
                      />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink/50">
          <span>
            Page {page} of {totalPages} · {total} event{total === 1 ? "" : "s"}
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
