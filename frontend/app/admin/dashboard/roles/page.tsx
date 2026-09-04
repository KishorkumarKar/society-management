"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { listRoles, deleteRole } from "@/lib/api/roles";
import type { BackendRole } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

const PAGE_SIZE = 20;

function RolesListContent() {
  const [rows, setRows] = useState<BackendRole[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listRoles({ page, limit: PAGE_SIZE, sort: "name" })
      .then((result) => {
        if (cancelled) return;
        setRows(result.data);
        setTotal(result.pagination.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError || err instanceof ApiNetworkError
            ? err.message
            : "Couldn't load roles right now."
        );
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  async function handleDelete(target: BackendRole) {
    try {
      await deleteRole(target.id);
      setRows((prev) => (prev ? prev.filter((r) => r.id !== target.id) : prev));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't delete this role. Only Super Admin can manage roles/permissions in the seeded data — you may just be missing that permission."
      );
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Roles"
        description="Society-scoped RBAC roles, plus any global roles (like Super Admin) visible everywhere. Open a role to manage its permissions."
        action={
          <Button href="/admin/dashboard/roles/new" variant="primary">
            <Plus size={16} strokeWidth={2} />
            Add role
          </Button>
        }
      />

      {error && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Description</th>
              <th className="px-5 py-3 font-medium">Scope</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows === null && !error && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-ink/40">
                  Loading roles…
                </td>
              </tr>
            )}
            {rows !== null && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-ink/40">
                  No roles yet.
                </td>
              </tr>
            )}
            {rows?.map((role) => (
              <tr key={role.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-4">
                  <Link
                    href={`/admin/dashboard/roles/${role.id}/edit`}
                    className="font-medium text-ink hover:text-brass"
                  >
                    {role.name}
                  </Link>
                </td>
                <td className="px-5 py-4 text-ink/60">{role.description || "—"}</td>
                <td className="px-5 py-4">
                  <Badge tone={role.society_id === null ? "brass" : "muted"}>
                    {role.society_id === null ? "Global" : "This society"}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/dashboard/roles/${role.id}/edit`}
                      aria-label={`Edit ${role.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                    >
                      <Pencil size={15} strokeWidth={1.75} />
                    </Link>
                    <ConfirmDeleteButton label={role.name} onConfirm={() => handleDelete(role)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink/50">
          <span>
            Page {page} of {totalPages} · {total} role{total === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="!border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="!border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RolesListPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <RolesListContent />
    </RequireRole>
  );
}
