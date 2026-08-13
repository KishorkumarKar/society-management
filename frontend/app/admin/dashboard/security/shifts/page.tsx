"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { findSocietyById, shiftsBySociety, guardsBySociety, shiftStatusTone } from "@/lib/data";
import type { ShiftStatus } from "@/lib/types";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import RequireRole from "@/components/admin/RequireRole";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const STATUS_FILTERS: { value: ShiftStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function ShiftsListContent() {
  const { user } = useAuth();
  const { shifts, guards, societies, deleteShift } = useData();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ShiftStatus | "all">("all");
  const [date, setDate] = useState("");
  const [guardId, setGuardId] = useState("all");

  if (!user) return null;

  const isSuperAdmin = user.role === "super-admin";
  const allRows = isSuperAdmin ? [...shifts].sort((a, b) => (a.shiftDate < b.shiftDate ? 1 : -1)) : shiftsBySociety(shifts, user.societyId);
  const scopedGuards = isSuperAdmin ? guards : guardsBySociety(guards, user.societyId);

  function guardName(id: string): string {
    return guards.find((g) => g.id === id)?.name ?? "Unassigned";
  }

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allRows.filter((s) => {
      const matchesStatus = status === "all" || s.status === status;
      const matchesDate = !date || s.shiftDate === date;
      const matchesGuard = guardId === "all" || s.guardId === guardId;
      const matchesSearch = !query || s.shiftName.toLowerCase().includes(query);
      return matchesStatus && matchesDate && matchesGuard && matchesSearch;
    });
  }, [allRows, search, status, date, guardId]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Security Shifts"
        description={
          isSuperAdmin
            ? "Every scheduled and past shift across every society."
            : "Guard shift roster for your society."
        }
        action={
          <Button href="/admin/dashboard/security/shifts/new" variant="primary">
            <Plus size={16} strokeWidth={2} />
            Create shift
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-[200px]">
          <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shift name"
            className="w-full rounded-sm border border-ink/15 bg-paper py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-ink/30 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-sm border border-ink/15 bg-paper px-4 py-2.5 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        />
        <select
          value={guardId}
          onChange={(e) => setGuardId(e.target.value)}
          className="rounded-sm border border-ink/15 bg-paper px-4 py-2.5 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        >
          <option value="all">All guards</option>
          {scopedGuards.map((guard) => (
            <option key={guard.id} value={guard.id}>
              {guard.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ShiftStatus | "all")}
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
              <th className="px-5 py-3 font-medium">Shift</th>
              <th className="px-5 py-3 font-medium">Guard</th>
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium">Date</th>
              {isSuperAdmin && <th className="px-5 py-3 font-medium">Society</th>}
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.length === 0 && (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} className="px-5 py-10 text-center text-ink/40">
                  {allRows.length === 0 ? "No shifts scheduled yet." : "No shifts match your filters."}
                </td>
              </tr>
            )}
            {rows.map((shift) => (
              <tr key={shift.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-ink">{shift.shiftName}</span>
                    <span className="text-xs text-ink/40">{shift.shiftType.replace("_", " ")}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-ink/60">{guardName(shift.guardId)}</td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">
                  {shift.startTime} – {shift.endTime} ({shift.durationHours}h)
                </td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">{shift.shiftDate}</td>
                {isSuperAdmin && (
                  <td className="px-5 py-4 text-ink/60">
                    {findSocietyById(societies, shift.societyId)?.name ?? "—"}
                  </td>
                )}
                <td className="px-5 py-4">
                  <Badge tone={shiftStatusTone(shift.status)}>{shift.status}</Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/dashboard/security/shifts/${shift.id}`}
                      aria-label={`View ${shift.shiftName}`}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                    >
                      <Eye size={15} strokeWidth={1.75} />
                    </Link>
                    <Link
                      href={`/admin/dashboard/security/shifts/${shift.id}/edit`}
                      aria-label={`Edit ${shift.shiftName}`}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                    >
                      <Pencil size={15} strokeWidth={1.75} />
                    </Link>
                    <ConfirmDeleteButton label={shift.shiftName} onConfirm={() => deleteShift(shift.id)} />
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

export default function ShiftsListPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <ShiftsListContent />
    </RequireRole>
  );
}
