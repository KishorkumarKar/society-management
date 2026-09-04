"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, Check, CheckCheck, Mail, MessageSquare, Smartphone, Trash2 } from "lucide-react";
import {
  listNotifications,
  deleteNotification,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/notifications";
import type { BackendNotification } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const PAGE_SIZE = 20;
const TABS = ["all", "unread"] as const;
type Tab = (typeof TABS)[number];

const CHANNEL_ICON: Record<BackendNotification["channel"], typeof Bell> = {
  in_app: Bell,
  email: Mail,
  sms: MessageSquare,
  push: Smartphone,
};

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

export default function NotificationsPage() {
  const [rows, setRows] = useState<BackendNotification[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<Tab>("all");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  function refresh() {
    setError(null);
    listNotifications({
      page,
      limit: PAGE_SIZE,
      isRead: tab === "unread" ? false : undefined,
      sort: "-created_at",
    })
      .then((result) => {
        setRows(result.data);
        setTotal(result.pagination.total);
      })
      .catch((err) => setError(errorMessage(err, "Couldn't load notifications right now.")));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tab]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
  const hasUnread = (rows ?? []).some((n) => !n.is_read);

  async function handleMarkRead(target: BackendNotification) {
    setBusyId(target.id);
    try {
      const updated = await markNotificationRead(target.id);
      setRows((prev) => (prev ? prev.map((n) => (n.id === updated.id ? updated : n)) : prev));
    } catch (err) {
      setError(errorMessage(err, "Couldn't mark this notification as read."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    setError(null);
    try {
      await markAllNotificationsRead();
      refresh();
    } catch (err) {
      setError(errorMessage(err, "Couldn't mark all as read."));
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleDelete(target: BackendNotification) {
    setBusyId(target.id);
    try {
      await deleteNotification(target.id);
      setRows((prev) => (prev ? prev.filter((n) => n.id !== target.id) : prev));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setError(errorMessage(err, "Couldn't delete this notification."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Notifications"
        description="Your own notifications — sent announcements, and anything else addressed to you."
        action={
          hasUnread ? (
            <Button
              variant="secondary"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="!border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
            >
              <CheckCheck size={16} strokeWidth={2} />
              {markingAll ? "Marking…" : "Mark all read"}
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setPage(1);
              setTab(t);
            }}
            className={`rounded-sm border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
              tab === t
                ? "border-brass bg-brass/10 text-brass-dark"
                : "border-ink/15 text-ink/60 hover:border-ink/30"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <Card className="divide-y divide-ink/10 p-0">
        {rows === null && !error && (
          <div className="px-5 py-10 text-center text-ink/40">Loading notifications…</div>
        )}
        {rows !== null && rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center text-ink/40">
            <BellOff size={22} strokeWidth={1.5} />
            <span>{tab === "unread" ? "Nothing unread." : "No notifications yet."}</span>
          </div>
        )}
        {rows?.map((notification) => {
          const Icon = CHANNEL_ICON[notification.channel];
          const isBusy = busyId === notification.id;
          return (
            <div
              key={notification.id}
              className={`flex items-start gap-4 px-5 py-4 ${!notification.is_read ? "bg-brass/[0.04]" : ""}`}
            >
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border ${
                  notification.is_read ? "border-ink/10 text-ink/40" : "border-brass/40 text-brass-dark"
                }`}
              >
                <Icon size={15} strokeWidth={1.75} />
              </span>
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${notification.is_read ? "text-ink/70" : "font-medium text-ink"}`}>
                    {notification.title}
                  </span>
                  {!notification.is_read && <span className="h-1.5 w-1.5 rounded-full bg-brass" />}
                </div>
                {notification.body && <p className="text-sm text-ink/50">{notification.body}</p>}
                <span className="font-mono text-[11px] text-ink/30">{formatDateTime(notification.created_at)}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {!notification.is_read && (
                  <button
                    type="button"
                    aria-label="Mark as read"
                    disabled={isBusy}
                    onClick={() => handleMarkRead(notification)}
                    className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-sage hover:text-sage disabled:opacity-40"
                  >
                    <Check size={15} strokeWidth={1.75} />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Delete notification"
                  disabled={isBusy}
                  onClick={() => handleDelete(notification)}
                  className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-rust hover:text-rust disabled:opacity-40"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          );
        })}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink/50">
          <span>
            Page {page} of {totalPages} · {total} notification{total === 1 ? "" : "s"}
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
