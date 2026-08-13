"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, LogOut, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { visitorsBySociety, visitorStatusTone, todayISODate, canManage, VISITOR_TYPES } from "@/lib/data";
import type { VisitorStatus, VisitorType } from "@/lib/types";
import PageHeader from "@/components/admin/PageHeader";
import RequireRole from "@/components/admin/RequireRole";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

type QuickFilter = "all" | "inside" | "today" | "completed";

const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "inside", label: "Currently Inside" },
  { value: "today", label: "Today's Visitors" },
  { value: "completed", label: "Completed Visits" },
];

const PAGE_SIZE = 10;

/**
 * Visitor records are fetched once into DataContext for this demo (there is
 * no backend to page against), but the list itself only ever RENDERS one
 * page of PAGE_SIZE rows at a time — the slice below is exactly where a
 * real API's `?page=&pageSize=&...filters` call would plug in.
 */
function VisitorsListContent() {
  const { user } = useAuth();
  const { visitors, deleteVisitor, markVisitorOut } = useData();
  const isManager = !!user && canManage(user.role);
  const canEdit = !!user && (canManage(user.role) || user.role === "security");

  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [search, setSearch] = useState("");
  const [flat, setFlat] = useState("");
  const [visitorType, setVisitorType] = useState<VisitorType | "all">("all");
  const [status, setStatus] = useState<VisitorStatus | "all">("all");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const allRows = user ? visitorsBySociety(visitors, user.societyId) : [];
  const today = todayISODate();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allRows.filter((v) => {
      if (quickFilter === "inside" && v.status !== "in") return false;
      if (quickFilter === "today" && v.inDate !== today) return false;
      if (quickFilter === "completed" && v.status !== "out") return false;

      const matchesSearch =
        !query || v.visitorName.toLowerCase().includes(query) || v.phone.includes(query);
      const matchesFlat = !flat.trim() || v.flatId.toLowerCase().includes(flat.trim().toLowerCase());
      const matchesType = visitorType === "all" || v.visitorType === visitorType;
      const matchesStatus = status === "all" || v.status === status;
      const matchesDate = !date || v.inDate === date;

      return matchesSearch && matchesFlat && matchesType && matchesStatus && matchesDate;
    });
  }, [allRows, search, flat, visitorType, status, date, quickFilter, today]);

  useEffect(() => {
    setPage(1);
  }, [search, flat, visitorType, status, date, quickFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Visitors"
        description="Register and track visitor entries for your society."
        action={
          <Button href="/admin/dashboard/security/visitors/new" variant="primary">
            <Plus size={16} strokeWidth={2} />
            Register visitor
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setQuickFilter(option.value)}
            className={`rounded-sm border px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
              quickFilter === option.value
                ? "border-brass bg-brass/10 text-brass"
                : "border-ink/15 text-ink/50 hover:border-brass/40 hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-[200px]">
          <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone"
            className="w-full rounded-sm border border-ink/15 bg-paper py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-ink/30 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
        </div>
        <input
          type="text"
          value={flat}
          onChange={(e) => setFlat(e.target.value)}
          placeholder="Flat / unit"
          className="w-36 rounded-sm border border-ink/15 bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        />
        <select
          value={visitorType}
          onChange={(e) => setVisitorType(e.target.value as VisitorType | "all")}
          className="rounded-sm border border-ink/15 bg-paper px-4 py-2.5 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        >
          <option value="all">All types</option>
          {VISITOR_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as VisitorStatus | "all")}
          className="rounded-sm border border-ink/15 bg-paper px-4 py-2.5 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        >
          <option value="all">All statuses</option>
          <option value="in">Inside</option>
          <option value="out">Out</option>
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-sm border border-ink/15 bg-paper px-4 py-2.5 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        />
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Visitor</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Flat</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Vehicle</th>
              <th className="px-5 py-3 font-medium">In</th>
              <th className="px-5 py-3 font-medium">Out</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-ink/40">
                  {allRows.length === 0 ? "No visitors registered yet." : "No visitors match your filters."}
                </td>
              </tr>
            )}
            {pageRows.map((visitor) => (
              <tr key={visitor.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-4 font-medium text-ink">{visitor.visitorName}</td>
                <td className="px-5 py-4 text-ink/60">{visitor.phone || "—"}</td>
                <td className="px-5 py-4 text-ink/60">{visitor.flatId}</td>
                <td className="px-5 py-4">
                  <Badge tone="muted">{visitor.visitorType}</Badge>
                </td>
                <td className="px-5 py-4 text-ink/60">{visitor.vehicleNumber || "—"}</td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">
                  {visitor.inDate} {visitor.inTime}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">
                  {visitor.status === "out" ? `${visitor.outDate} ${visitor.outTime}` : "—"}
                </td>
                <td className="px-5 py-4">
                  <Badge tone={visitorStatusTone(visitor.status)}>{visitor.status === "in" ? "Inside" : "Out"}</Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {visitor.status === "in" && (
                      <button
                        type="button"
                        onClick={() => markVisitorOut(visitor.id)}
                        aria-label={`Mark ${visitor.visitorName} out`}
                        className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-sage hover:text-sage"
                      >
                        <LogOut size={15} strokeWidth={1.75} />
                      </button>
                    )}
                    <Link
                      href={`/admin/dashboard/security/visitors/${visitor.id}`}
                      aria-label={`View ${visitor.visitorName}`}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                    >
                      <Eye size={15} strokeWidth={1.75} />
                    </Link>
                    {canEdit && (
                      <Link
                        href={`/admin/dashboard/security/visitors/${visitor.id}/edit`}
                        aria-label={`Edit ${visitor.visitorName}`}
                        className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                      >
                        <Pencil size={15} strokeWidth={1.75} />
                      </Link>
                    )}
                    {isManager && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete ${visitor.visitorName}'s visitor entry? This can't be undone in this session.`)) {
                            deleteVisitor(visitor.id);
                          }
                        }}
                        aria-label={`Delete ${visitor.visitorName}`}
                        className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/40 transition-colors hover:border-rust hover:text-rust"
                      >
                        <Trash2 size={15} strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-ink/50">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-sm border border-ink/15 px-3 py-1.5 transition-colors hover:border-brass hover:text-brass disabled:opacity-30"
            >
              Previous
            </button>
            <span className="font-mono text-xs">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-sm border border-ink/15 px-3 py-1.5 transition-colors hover:border-brass hover:text-brass disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VisitorsListPage() {
  return (
    <RequireRole roles={["admin", "super-admin", "security"]}>
      <VisitorsListContent />
    </RequireRole>
  );
}
