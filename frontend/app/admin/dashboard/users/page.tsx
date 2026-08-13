"use client";

import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { findSocietyById, usersBySociety, roleLabel } from "@/lib/data";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import RequireRole from "@/components/admin/RequireRole";

function UsersListContent() {
  const { user } = useAuth();
  const { users, societies, deleteUser } = useData();

  if (!user) return null;

  const isSuperAdmin = user.role === "super-admin";
  const rows = isSuperAdmin ? users : usersBySociety(users, user.societyId);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Users"
        description={
          isSuperAdmin
            ? "Everyone registered across every society on the network."
            : "Residents, committee members and staff in your society."
        }
        action={
          <Button href="/admin/dashboard/users/new" variant="primary">
            <Plus size={16} strokeWidth={2} />
            Add user
          </Button>
        }
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Contact</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Designation</th>
              <th className="px-5 py-3 font-medium">Unit</th>
              {isSuperAdmin && <th className="px-5 py-3 font-medium">Society</th>}
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.length === 0 && (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} className="px-5 py-10 text-center text-ink/40">
                  No users yet.
                </td>
              </tr>
            )}
            {rows.map((member) => (
              <tr key={member.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-xs text-brass">
                      {member.initial}
                    </span>
                    <span className="font-medium text-ink">{member.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-ink/60">
                  <div className="flex flex-col">
                    <span>{member.email}</span>
                    <span className="text-xs text-ink/40">{member.phone}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge tone={member.role === "super-admin" || member.role === "admin" ? "brass" : "muted"}>
                    {roleLabel(member.role)}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-ink/60">{member.designation}</td>
                <td className="px-5 py-4 text-ink/60">{member.unit}</td>
                {isSuperAdmin && (
                  <td className="px-5 py-4 text-ink/60">
                    {findSocietyById(societies, member.societyId)?.name ?? "—"}
                  </td>
                )}
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/dashboard/users/${member.id}/edit`}
                      aria-label={`Edit ${member.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                    >
                      <Pencil size={15} strokeWidth={1.75} />
                    </Link>
                    <ConfirmDeleteButton
                      label={member.name}
                      onConfirm={() => deleteUser(member.id)}
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

export default function UsersListPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <UsersListContent />
    </RequireRole>
  );
}
