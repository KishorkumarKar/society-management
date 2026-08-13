"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { usersBySociety, roleLabel } from "@/lib/data";
import type { UserRole } from "@/lib/types";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const ROLE_FILTERS: { value: UserRole | "all"; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "admin", label: "Society Admin" },
  { value: "committee", label: "Committee Member" },
  { value: "resident", label: "Resident" },
  { value: "security", label: "Security Desk" },
];

/** Read-only directory for the person's own society — no create/edit/delete,
 *  just a searchable, filterable list. */
export default function MembersDirectoryPage() {
  const { user } = useAuth();
  const { users } = useData();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "all">("all");

  if (!user) return null;

  const allMembers = usersBySociety(users, user.societyId);

  const members = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allMembers.filter((m) => {
      const matchesRole = role === "all" || m.role === role;
      const matchesSearch =
        !query ||
        m.name.toLowerCase().includes(query) ||
        m.unit.toLowerCase().includes(query) ||
        m.designation.toLowerCase().includes(query);
      return matchesRole && matchesSearch;
    });
  }, [allMembers, search, role]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Members" description="Everyone registered in your society." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, unit or designation"
            className="w-full rounded-sm border border-ink/15 bg-paper py-2.5 pl-9 pr-4 text-sm text-ink placeholder:text-ink/30 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole | "all")}
          className="rounded-sm border border-ink/15 bg-paper px-4 py-2.5 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        >
          {ROLE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Card className="divide-y divide-ink/10 p-0">
        {members.length === 0 && (
          <p className="p-6 text-sm text-ink/50">
            {allMembers.length === 0 ? "No members registered yet." : "No members match your filters."}
          </p>
        )}
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-xs text-brass">
                {member.initial}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-ink">{member.name}</span>
                <span className="text-xs text-ink/50">{member.designation} · {member.unit}</span>
              </div>
            </div>
            <Badge tone={member.role === "admin" ? "brass" : "muted"}>{roleLabel(member.role)}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}
