"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { findSocietyById, guardsBySociety, guardStatusTone } from "@/lib/data";
import type { GuardStatus } from "@/lib/types";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import RequireRole from "@/components/admin/RequireRole";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const STATUS_FILTERS: { value: GuardStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function GuardsListContent() {
  const { user } = useAuth();
  const { guards, societies, deleteGuard } = useData();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<GuardStatus | "all">("all");

  if (!user) return null;

  const isSuperAdmin = user.role === "super-admin";
  const allRows = isSuperAdmin ? guards : guardsBySociety(guards, user.societyId);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allRows.filter((g) => {
      const matchesStatus = status === "all" || g.status === status;
      const matchesSearch =
        !query ||
        g.name.toLowerCase().includes(query) ||
        g.employeeCode.toLowerCase().includes(query) ||
        g.phone.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [allRows, search, status]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Security Guards"
        description={
          isSuperAdmin
            ? "Every guard on the roster across every society."
            : "Your society's security guard roster."
        }
        action={
          <Button href="/admin/dashboard/security/guards/new" variant="primary">
            <Plus size={16} strokeWidth={2} />
            Add guard
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code or phone"
            className="w-full rounded-sm border border-ink/15 bg-paper py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-ink/30 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as GuardStatus | "all")}
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
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Employee code</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              {isSuperAdmin && <th className="px-5 py-3 font-medium">Society</th>}
              <th className="px-5 py-3 font-medium">Joined</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.length === 0 && (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} className="px-5 py-10 text-center text-ink/40">
                  {allRows.length === 0 ? "No guards added yet." : "No guards match your filters."}
                </td>
              </tr>
            )}
            {rows.map((guard) => (
              <tr key={guard.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-4 font-medium text-ink">{guard.name}</td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">{guard.employeeCode}</td>
                <td className="px-5 py-4 text-ink/60">{guard.phone}</td>
                {isSuperAdmin && (
                  <td className="px-5 py-4 text-ink/60">
                    {findSocietyById(societies, guard.societyId)?.name ?? "—"}
                  </td>
                )}
                <td className="px-5 py-4 font-mono text-xs text-ink/50">{guard.joiningDate || "—"}</td>
                <td className="px-5 py-4">
                  <Badge tone={guardStatusTone(guard.status)}>{guard.status}</Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/dashboard/security/guards/${guard.id}`}
                      aria-label={`View ${guard.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                    >
                      <Eye size={15} strokeWidth={1.75} />
                    </Link>
                    <Link
                      href={`/admin/dashboard/security/guards/${guard.id}/edit`}
                      aria-label={`Edit ${guard.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                    >
                      <Pencil size={15} strokeWidth={1.75} />
                    </Link>
                    <ConfirmDeleteButton
                      label={`${guard.name} (and their shifts)`}
                      onConfirm={() => deleteGuard(guard.id)}
                    />
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

export default function GuardsListPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <GuardsListContent />
    </RequireRole>
  );
}
