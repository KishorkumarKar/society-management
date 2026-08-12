"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ArrowLeft, ListChecks, Wallet, Receipt } from "lucide-react";
import { useData } from "@/context/DataContext";
import { eventTotals, eventStatusTone } from "@/lib/data";
import PageHeader from "@/components/admin/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function EventWorkspaceLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const pathname = usePathname();
  const { events, collections, expenses } = useData();

  const event = events.find((e) => e.id === id);

  if (!event) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Event not found" description="This event may have already been removed." />
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

  const totals = eventTotals(event.id, collections, expenses);
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
              <Badge tone={eventStatusTone(event.status)}>{event.status}</Badge>
            </div>
            <p className="text-sm text-ink/50">{event.date}</p>
          </div>

          <div className="flex gap-6 font-mono text-xs uppercase tracking-wider text-ink/50">
            <div className="flex flex-col gap-1">
              <span>Collected</span>
              <span className="font-display text-lg normal-case tracking-normal text-ink">
                ₹{totals.collected.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span>Spent</span>
              <span className="font-display text-lg normal-case tracking-normal text-ink">
                ₹{totals.spent.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span>Balance</span>
              <span
                className={`font-display text-lg normal-case tracking-normal ${
                  totals.balance < 0 ? "text-rust" : "text-sage"
                }`}
              >
                ₹{totals.balance.toLocaleString("en-IN")}
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
