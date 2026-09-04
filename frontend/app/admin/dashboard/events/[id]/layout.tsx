"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ArrowLeft, ListChecks, Wallet, Receipt } from "lucide-react";
import { getEvent } from "@/lib/api/events";
import { listEventCollections } from "@/lib/api/eventCollections";
import { listEventExpenses } from "@/lib/api/eventExpenses";
import type { BackendEvent } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import PageHeader from "@/components/admin/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

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

export default function EventWorkspaceLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const id = typeof params.id === "string" ? Number(params.id) : NaN;
  const pathname = usePathname();

  const [event, setEvent] = useState<BackendEvent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [totals, setTotals] = useState<{ collected: number; spent: number } | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid event id.");
      return;
    }
    getEvent(id)
      .then(setEvent)
      .catch((err) =>
        setLoadError(
          err instanceof ApiError || err instanceof ApiNetworkError
            ? err.message
            : "This event may have already been removed."
        )
      );

    Promise.all([
      listEventCollections({ eventId: id, limit: 200 }),
      listEventExpenses({ eventId: id, limit: 200 }),
    ])
      .then(([collectionsRes, expensesRes]) => {
        setTotals({
          collected: collectionsRes.data.reduce((sum, c) => sum + Number(c.amount_paid), 0),
          spent: expensesRes.data.reduce((sum, e) => sum + Number(e.amount), 0),
        });
      })
      .catch(() => {
        // Totals are a nice-to-have header stat; a failed fetch just
        // leaves them blank rather than blocking the page.
      });
  }, [id]);

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Event not found" description={loadError} />
        <Button
          href="/admin/dashboard/events"
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to events
        </Button>
      </div>
    );
  }

  if (!event) {
    return <div className="py-16 text-center text-ink/40">Loading…</div>;
  }

  const balance = totals ? totals.collected - totals.spent : null;
  const base = `/admin/dashboard/events/${event.id}`;
  const tabs = [
    { href: base, label: "Details", icon: ListChecks },
    { href: `${base}/collections`, label: "Collections", icon: Wallet },
    { href: `${base}/expenses`, label: "Expenses", icon: Receipt },
  ];
  const showTabs = tabs.some((tab) => tab.href === pathname);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/dashboard/events"
          className="flex w-fit items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink/50 transition-colors hover:text-brass"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          All events
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl text-ink sm:text-3xl">{event.name}</h1>
              <Badge tone={statusTone(event.status)}>{event.status}</Badge>
            </div>
            <p className="text-sm text-ink/50">{formatDate(event.event_date)}</p>
          </div>

          <div className="flex gap-6 font-mono text-xs uppercase tracking-wider text-ink/50">
            <div className="flex flex-col gap-1">
              <span>Collected</span>
              <span className="font-display text-lg normal-case tracking-normal text-ink">
                {totals ? `₹${totals.collected.toLocaleString("en-IN")}` : "…"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span>Spent</span>
              <span className="font-display text-lg normal-case tracking-normal text-ink">
                {totals ? `₹${totals.spent.toLocaleString("en-IN")}` : "…"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span>Balance</span>
              <span
                className={`font-display text-lg normal-case tracking-normal ${
                  balance !== null && balance < 0 ? "text-rust" : "text-sage"
                }`}
              >
                {balance !== null ? `₹${balance.toLocaleString("en-IN")}` : "…"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showTabs && (
        <div className="flex gap-2 border-b border-ink/10">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors ${
                  active
                    ? "border-brass text-brass"
                    : "border-transparent text-ink/50 hover:text-ink"
                }`}
              >
                <Icon size={15} strokeWidth={1.75} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}

      {children}
    </div>
  );
}
