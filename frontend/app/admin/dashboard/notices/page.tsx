"use client";

import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { findSocietyById, noticesBySociety } from "@/lib/data";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import RequireRole from "@/components/admin/RequireRole";

function NoticesListContent() {
  const { user } = useAuth();
  const { notices, societies, deleteNotice } = useData();

  if (!user) return null;

  const isSuperAdmin = user.role === "super-admin";
  const rows = isSuperAdmin
    ? [...notices].sort((a, b) => (a.date < b.date ? 1 : -1))
    : noticesBySociety(notices, user.societyId);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Notices"
        description={
          isSuperAdmin
            ? "Everything pinned to every society's noticeboard."
            : "What's pinned to your society's noticeboard."
        }
        action={
          <Button href="/admin/dashboard/notices/new" variant="primary">
            <Plus size={16} strokeWidth={2} />
            Add notice
          </Button>
        }
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Date</th>
              {isSuperAdmin && <th className="px-5 py-3 font-medium">Society</th>}
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.length === 0 && (
              <tr>
                <td colSpan={isSuperAdmin ? 5 : 4} className="px-5 py-10 text-center text-ink/40">
                  Nothing pinned yet.
                </td>
              </tr>
            )}
            {rows.map((notice) => (
              <tr key={notice.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="max-w-xs px-5 py-4 font-medium text-ink">{notice.title}</td>
                <td className="px-5 py-4">
                  <Badge tone="sage">{notice.category}</Badge>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">{notice.date}</td>
                {isSuperAdmin && (
                  <td className="px-5 py-4 text-ink/60">
                    {findSocietyById(societies, notice.societyId)?.name ?? "—"}
                  </td>
                )}
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/dashboard/notices/${notice.id}/edit`}
                      aria-label={`Edit ${notice.title}`}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                    >
                      <Pencil size={15} strokeWidth={1.75} />
                    </Link>
                    <ConfirmDeleteButton
                      label={notice.title}
                      onConfirm={() => deleteNotice(notice.id)}
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

export default function NoticesListPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <NoticesListContent />
    </RequireRole>
  );
}
