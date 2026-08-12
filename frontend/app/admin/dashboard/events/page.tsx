"use client";

import Link from "next/link";
import { Eye, Pencil, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { findSocietyById, eventsBySociety, eventTotals, eventStatusTone, canManage } from "@/lib/data";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function EventsListPage() {
  const { user } = useAuth();
  const { events, societies, collections, expenses, deleteEvent } = useData();

  if (!user) return null;

  const isSuperAdmin = user.role === "super-admin";
  const isManager = canManage(user.role);
  const rows = isSuperAdmin
    ? [...events].sort((a, b) => (a.date < b.date ? 1 : -1))
    : eventsBySociety(events, user.societyId);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Events"
        description={
          isSuperAdmin
            ? "Every event across every society, with collections and expenses tracked per event."
            : isManager
              ? "Fund-raising and social events for your society — with collections and expenses tracked per event."
              : "Events happening in your society. Open one to view its collections and expenses."
        }
        action={
          isManager ? (
            <Button href="/admin/dashboard/events/new" variant="primary">
              <Plus size={16} strokeWidth={2} />
              Add event
            </Button>
          ) : undefined
        }
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Event</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
              {isSuperAdmin && <th className="px-5 py-3 font-medium">Society</th>}
              <th className="px-5 py-3 font-medium">Collected / Target</th>
              <th className="px-5 py-3 font-medium">Spent</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.length === 0 && (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} className="px-5 py-10 text-center text-ink/40">
                  No events yet.
                </td>
              </tr>
            )}
            {rows.map((event) => {
              const totals = eventTotals(event.id, collections, expenses);
              return (
                <tr key={event.id} className="transition-colors hover:bg-ink/[0.02]">
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/dashboard/events/${event.id}`}
                      className="font-medium text-ink hover:text-brass"
                    >
                      {event.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-ink/50">{event.date}</td>
                  <td className="px-5 py-4">
                    <Badge tone={eventStatusTone(event.status)}>{event.status}</Badge>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-5 py-4 text-ink/60">
                      {findSocietyById(societies, event.societyId)?.name ?? "—"}
                    </td>
                  )}
                  <td className="px-5 py-4 text-ink/60">
                    ₹{totals.collected.toLocaleString("en-IN")} / ₹{event.targetAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4 text-ink/60">₹{totals.spent.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/dashboard/events/${event.id}`}
                        aria-label={`View ${event.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                      >
                        <Eye size={15} strokeWidth={1.75} />
                      </Link>
                      {isManager && (
                        <>
                          <Link
                            href={`/admin/dashboard/events/${event.id}/edit`}
                            aria-label={`Edit ${event.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                          >
                            <Pencil size={15} strokeWidth={1.75} />
                          </Link>
                          <ConfirmDeleteButton
                            label={`${event.name} (and its collections & expenses)`}
                            onConfirm={() => deleteEvent(event.id)}
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
    </div>
  );
}
