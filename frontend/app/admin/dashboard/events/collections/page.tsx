"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { listEventCollections } from "@/lib/api/eventCollections";
import { listEvents } from "@/lib/api/events";
import type { BackendEventCollection, BackendEvent } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import RequireRole from "@/components/admin/RequireRole";

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

/** Rolls up collections across every event in the caller's society —
 *  `GET /event-collections` without an `eventId` filter returns exactly
 *  that (tenant-isolated, same as everything else). */
function AllCollectionsContent() {
  const [rows, setRows] = useState<BackendEventCollection[] | null>(null);
  const [events, setEvents] = useState<Map<number, BackendEvent>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [eventId, setEventId] = useState("all");

  useEffect(() => {
    listEventCollections({ limit: 200, sort: "-created_at" })
      .then((res) => setRows(res.data))
      .catch((err) => setError(errorMessage(err, "Couldn't load collections right now.")));
    listEvents({ limit: 100 })
      .then((res) => setEvents(new Map(res.data.map((e) => [e.id, e]))))
      .catch(() => {
        // Event names are a nice-to-have here; falls back to the raw id.
      });
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (rows ?? []).filter((c) => {
      const matchesEvent = eventId === "all" || c.event_id === Number(eventId);
      const matchesStatus = status === "all" || c.status === status;
      const matchesSearch =
        !query || c.member_name.toLowerCase().includes(query) || c.unit.toLowerCase().includes(query);
      return matchesEvent && matchesStatus && matchesSearch;
    });
  }, [rows, search, status, eventId]);

  const totalDue = filtered.reduce((sum, c) => sum + Number(c.amount_due), 0);
  const totalPaid = filtered.reduce((sum, c) => sum + Number(c.amount_paid), 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Collections"
        description="Every member contribution across all of your society's events."
      />

      {error && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <p className="text-sm text-ink/50">
        ₹{totalPaid.toLocaleString("en-IN")} collected of ₹{totalDue.toLocaleString("en-IN")} due across{" "}
        {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}.
      </p>

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
          {[...events.values()].map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
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

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Member</th>
              <th className="px-5 py-3 font-medium">Event</th>
              <th className="px-5 py-3 font-medium">Unit</th>
              <th className="px-5 py-3 font-medium">Due</th>
              <th className="px-5 py-3 font-medium">Paid</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows === null && !error && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/40">
                  Loading collections…
                </td>
              </tr>
            )}
            {rows !== null && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/40">
                  No collections match your filters.
                </td>
              </tr>
            )}
            {filtered.map((collection) => (
              <tr key={collection.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-4 font-medium text-ink">
                  <Link
                    href={`/admin/dashboard/events/${collection.event_id}/collections/${collection.id}`}
                    className="hover:text-brass"
                  >
                    {collection.member_name}
                  </Link>
                </td>
                <td className="px-5 py-4 text-ink/60">{events.get(collection.event_id)?.name ?? `#${collection.event_id}`}</td>
                <td className="px-5 py-4 text-ink/60">{collection.unit}</td>
                <td className="px-5 py-4 text-ink/60">₹{Number(collection.amount_due).toLocaleString("en-IN")}</td>
                <td className="px-5 py-4 text-ink/60">₹{Number(collection.amount_paid).toLocaleString("en-IN")}</td>
                <td className="px-5 py-4">
                  <Badge tone={statusTone(collection.status)}>{collection.status}</Badge>
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
