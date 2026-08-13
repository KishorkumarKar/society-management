"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Wallet, Receipt, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { findSocietyById, eventTotals, canManage } from "@/lib/data";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

/**
 * The Details tab intentionally only loads event-level data (name,
 * description, date, target, totals). Row-level collections and expenses
 * are fetched only when the person opens those tabs — see the sibling
 * collections/page.tsx and expenses/page.tsx.
 */
export default function EventDetailsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const { events, societies, collections, expenses } = useData();

  const event = events.find((e) => e.id === id);
  if (!event || !user) return null;

  const isSuperAdmin = user.role === "super-admin";
  const isManager = canManage(user.role);
  const society = findSocietyById(societies, event.societyId);
  const totals = eventTotals(event.id, collections, expenses);
  const progress =
    event.targetAmount > 0 ? Math.min(100, Math.round((totals.collected / event.targetAmount) * 100)) : 0;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      <div className="flex flex-col gap-6 lg:col-span-3">
        <Card className="flex flex-col gap-4 p-6">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">About this event</span>
          <p className="text-sm leading-relaxed text-ink/70">
            {event.description || "No description added yet."}
          </p>
          <dl className="grid grid-cols-2 gap-4 border-t border-ink/10 pt-4 text-sm">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Date</dt>
              <dd className="mt-1 text-ink">{event.date || "—"}</dd>
            </div>
            {isSuperAdmin && (
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Society</dt>
                <dd className="mt-1 text-ink">{society?.name ?? "—"}</dd>
              </div>
            )}
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Target amount</dt>
              <dd className="mt-1 text-ink">₹{event.targetAmount.toLocaleString("en-IN")}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Collected so far</dt>
              <dd className="mt-1 text-ink">{progress}% of target</dd>
            </div>
          </dl>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-brass" style={{ width: `${progress}%` }} />
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-2">
        <Link
          href={`/admin/dashboard/events/${event.id}/collections`}
          className="group flex items-center justify-between rounded-sm border border-ink/10 bg-paper p-6 shadow-pin transition-colors hover:border-brass/40"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-sage/10 text-sage">
              <Wallet size={18} strokeWidth={1.75} />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-lg text-ink">Collections</span>
              <span className="text-xs text-ink/50">Open to view member payments for this event</span>
            </div>
          </div>
          <ArrowRight size={18} className="text-ink/30 transition-colors group-hover:text-brass" />
        </Link>

        <Link
          href={`/admin/dashboard/events/${event.id}/expenses`}
          className="group flex items-center justify-between rounded-sm border border-ink/10 bg-paper p-6 shadow-pin transition-colors hover:border-brass/40"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-rust/10 text-rust">
              <Receipt size={18} strokeWidth={1.75} />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-lg text-ink">Expenses</span>
              <span className="text-xs text-ink/50">Open to view spend for this event</span>
            </div>
          </div>
          <ArrowRight size={18} className="text-ink/30 transition-colors group-hover:text-brass" />
        </Link>

        {isManager && (
          <Button
            href={`/admin/dashboard/events/${event.id}/edit`}
            variant="secondary"
            className="w-full !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
          >
            Edit event details
          </Button>
        )}
      </div>
    </div>
  );
}
