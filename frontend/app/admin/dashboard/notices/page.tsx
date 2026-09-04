"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Send } from "lucide-react";
import { listAnnouncements, deleteAnnouncement, sendAnnouncement } from "@/lib/api/announcements";
import type { BackendAnnouncement } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const PAGE_SIZE = 20;

function priorityTone(priority: BackendAnnouncement["priority"]): "sage" | "brass" | "rust" | "muted" {
  switch (priority) {
    case "urgent":
      return "rust";
    case "high":
      return "brass";
    case "normal":
      return "sage";
    default:
      return "muted";
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError || err instanceof ApiNetworkError ? err.message : fallback;
}

function NoticesListContent() {
  const [rows, setRows] = useState<BackendAnnouncement[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function refresh() {
    setError(null);
    listAnnouncements({ page, limit: PAGE_SIZE, sort: "-created_at" })
      .then((result) => {
        setRows(result.data);
        setTotal(result.pagination.total);
      })
      .catch((err) => setError(errorMessage(err, "Couldn't load notices right now.")));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  async function handleDelete(target: BackendAnnouncement) {
    try {
      await deleteAnnouncement(target.id);
      setRows((prev) => (prev ? prev.filter((n) => n.id !== target.id) : prev));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setError(errorMessage(err, "Couldn't delete this notice."));
    }
  }

  async function handleSend(target: BackendAnnouncement) {
    setError(null);
    setBusyId(target.id);
    try {
      const updated = await sendAnnouncement(target.id);
      setRows((prev) => (prev ? prev.map((n) => (n.id === updated.id ? updated : n)) : prev));
    } catch (err) {
      setError(errorMessage(err, "Couldn't send this notice."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Notices"
        description="Your society's noticeboard. Creating a notice doesn't notify anyone by itself — use Send to dispatch it."
        action={
          <Button href="/admin/dashboard/notices/new" variant="primary">
            <Plus size={16} strokeWidth={2} />
            Add notice
          </Button>
        }
      />

      {error && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Priority</th>
              <th className="px-5 py-3 font-medium">Audience</th>
              <th className="px-5 py-3 font-medium">Sent</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows === null && !error && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink/40">
                  Loading notices…
                </td>
              </tr>
            )}
            {rows !== null && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink/40">
                  Nothing pinned yet.
                </td>
              </tr>
            )}
            {rows?.map((notice) => (
              <tr key={notice.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="max-w-xs px-5 py-4 font-medium text-ink">{notice.title}</td>
                <td className="px-5 py-4">
                  <Badge tone={priorityTone(notice.priority)}>{notice.priority}</Badge>
                </td>
                <td className="px-5 py-4 text-ink/60">
                  {notice.targetRoleIds.length === 0 ? "Society-wide" : `${notice.targetRoleIds.length} role(s)`}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">{formatDate(notice.sent_at)}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {!notice.sent_at && (
                      <button
                        type="button"
                        aria-label={`Send ${notice.title}`}
                        disabled={busyId === notice.id}
                        onClick={() => handleSend(notice)}
                        className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-sage hover:text-sage disabled:opacity-40"
                      >
                        <Send size={14} strokeWidth={1.75} />
                      </button>
                    )}
                    <Link
                      href={`/admin/dashboard/notices/${notice.id}/edit`}
                      aria-label={`Edit ${notice.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                    >
                      <Pencil size={15} strokeWidth={1.75} />
                    </Link>
                    <ConfirmDeleteButton label={notice.title} onConfirm={() => handleDelete(notice)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink/50">
          <span>
            Page {page} of {totalPages} · {total} notice{total === 1 ? "" : "s"}
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

export default function NoticesListPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <NoticesListContent />
    </RequireRole>
  );
}
