"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { findSocietyById, eventsBySociety, collectionStatusTone } from "@/lib/data";
import type { CollectionStatus } from "@/lib/types";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import RequireRole from "@/components/admin/RequireRole";

const STATUS_FILTERS: { value: CollectionStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "pending", label: "Pending" },
];

function AllCollectionsContent() {
  const { user } = useAuth();
  const { events, collections, societies } = useData();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CollectionStatus | "all">("all");
  const [eventId, setEventId] = useState("all");

  if (!user) return null;

  const isSuperAdmin = user.role === "super-admin";
  const scopedEvents = isSuperAdmin ? events : eventsBySociety(events, user.societyId);
  const scopedEventIds = new Set(scopedEvents.map((e) => e.id));

  function eventName(id: string): string {
    return events.find((e) => e.id === id)?.name ?? "—";
  }

  const allRows = [...collections]
    .filter((c) => scopedEventIds.has(c.eventId))
    .sort((a, b) => (a.paymentDate < b.paymentDate ? 1 : -1));

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allRows.filter((c) => {
      const matchesEvent = eventId === "all" || c.eventId === eventId;
      const matchesStatus = status === "all" || c.status === status;
      const matchesSearch =
        !query ||
        c.memberName.toLowerCase().includes(query) ||
        c.unit.toLowerCase().includes(query);
      return matchesEvent && matchesStatus && matchesSearch;
    });
  }, [allRows, search, status, eventId]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Collections"
        description="Every member payment recorded across all events. Open an event to add or edit entries."
      />

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
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="rounded-sm border border-ink/15 bg-paper px-4 py-2.5 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        >
          <option value="all">All events</option>
          {scopedEvents.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as CollectionStatus | "all")}
          className="rounded-sm border border-ink/15 bg-paper px-4 py-2.5 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Member</th>
              <th className="px-5 py-3 font-medium">Unit</th>
              <th className="px-5 py-3 font-medium">Event</th>
              {isSuperAdmin && <th className="px-5 py-3 font-medium">Society</th>}
              <th className="px-5 py-3 font-medium">Due</th>
              <th className="px-5 py-3 font-medium">Paid</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.length === 0 && (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} className="px-5 py-10 text-center text-ink/40">
                  {allRows.length === 0 ? "No collection entries yet." : "No entries match your filters."}
                </td>
              </tr>
            )}
            {rows.map((collection) => (
              <tr key={collection.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-4 font-medium text-ink">{collection.memberName}</td>
                <td className="px-5 py-4 text-ink/60">{collection.unit}</td>
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/dashboard/events/${collection.eventId}/collections`}
                    className="text-ink/70 hover:text-brass"
                  >
                    {eventName(collection.eventId)}
                  </Link>
                </td>
                {isSuperAdmin && (
                  <td className="px-5 py-4 text-ink/60">
                    {findSocietyById(societies, collection.societyId)?.name ?? "—"}
                  </td>
                )}
                <td className="px-5 py-4 text-ink/60">₹{collection.amountDue.toLocaleString("en-IN")}</td>
                <td className="px-5 py-4 text-ink/60">₹{collection.amountPaid.toLocaleString("en-IN")}</td>
                <td className="px-5 py-4">
                  <Badge tone={collectionStatusTone(collection.status)}>{collection.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default function AllCollectionsPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <AllCollectionsContent />
    </RequireRole>
  );
}
