"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Eye, Pencil, Plus, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { collectionsByEvent, collectionStatusTone, canManage } from "@/lib/data";
import type { CollectionStatus } from "@/lib/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";

const STATUS_FILTERS: { value: CollectionStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "pending", label: "Pending" },
];

/** This tab fetches only this event's collections — opened lazily, not
 *  loaded alongside the Details or Expenses tabs. */
export default function EventCollectionsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const { collections, deleteCollection } = useData();
  const isManager = !!user && canManage(user.role);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CollectionStatus | "all">("all");

  const allRows = collectionsByEvent(collections, id);
  const totalDue = allRows.reduce((sum, c) => sum + c.amountDue, 0);
  const totalPaid = allRows.reduce((sum, c) => sum + c.amountPaid, 0);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allRows.filter((c) => {
      const matchesStatus = status === "all" || c.status === status;
      const matchesSearch =
        !query ||
        c.memberName.toLowerCase().includes(query) ||
        c.unit.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [allRows, search, status]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-ink/50">
          ₹{totalPaid.toLocaleString("en-IN")} collected of ₹{totalDue.toLocaleString("en-IN")} due across{" "}
          {allRows.length} member{allRows.length === 1 ? "" : "s"}.
        </p>
        {isManager && (
          <Button href={`/admin/dashboard/events/${id}/collections/new`} variant="primary">
            <Plus size={16} strokeWidth={2} />
            Add collection
          </Button>
        )}
      </div>

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
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Member</th>
              <th className="px-5 py-3 font-medium">Unit</th>
              <th className="px-5 py-3 font-medium">Due</th>
              <th className="px-5 py-3 font-medium">Paid</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink/40">
                  {allRows.length === 0
                    ? "No collections recorded for this event yet."
                    : "No collections match your filters."}
                </td>
              </tr>
            )}
            {rows.map((collection) => (
              <tr key={collection.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-4 font-medium text-ink">{collection.memberName}</td>
                <td className="px-5 py-4 text-ink/60">{collection.unit}</td>
                <td className="px-5 py-4 text-ink/60">₹{collection.amountDue.toLocaleString("en-IN")}</td>
                <td className="px-5 py-4 text-ink/60">₹{collection.amountPaid.toLocaleString("en-IN")}</td>
                <td className="px-5 py-4">
                  <Badge tone={collectionStatusTone(collection.status)}>{collection.status}</Badge>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">{collection.paymentDate || "—"}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/dashboard/events/${id}/collections/${collection.id}`}
                      aria-label={`View ${collection.memberName}'s collection`}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                    >
                      <Eye size={15} strokeWidth={1.75} />
                    </Link>
                    {isManager && (
                      <>
                        <Link
                          href={`/admin/dashboard/events/${id}/collections/${collection.id}/edit`}
                          aria-label={`Edit ${collection.memberName}'s collection`}
                          className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                        >
                          <Pencil size={15} strokeWidth={1.75} />
                        </Link>
                        <ConfirmDeleteButton
                          label={`${collection.memberName}'s collection entry`}
                          onConfirm={() => deleteCollection(collection.id)}
                        />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
