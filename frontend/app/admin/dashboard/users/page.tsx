"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { listUsers, deleteUser } from "@/lib/api/users";
import { listFlats } from "@/lib/api/flats";
import type { BackendUser, BackendFlat } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import RequireRole from "@/components/admin/RequireRole";

const PAGE_SIZE = 20;

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function UsersListContent() {
  const { user } = useAuth();

  const [rows, setRows] = useState<BackendUser[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [flatsById, setFlatsById] = useState<Map<number, BackendFlat>>(new Map());

  useEffect(() => {
    listFlats({ limit: 100 })
      .then((res) => setFlatsById(new Map(res.data.map((f) => [f.id, f]))))
      .catch(() => {
        // Flat labels are a nice-to-have; a failed fetch just means the
        // table falls back to showing the raw flat id.
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listUsers({ page, limit: PAGE_SIZE, search: search || undefined, sort: "-created_at" })
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
            : "Couldn't load users right now."
        );
      });
    return () => {
      cancelled = true;
    };
  }, [page, search]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  async function handleDelete(target: BackendUser) {
    try {
      await deleteUser(target.id);
      setRows((prev) => (prev ? prev.filter((u) => u.id !== target.id) : prev));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't delete this user."
      );
    }
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Users"
        description={`Residents, committee members and staff in ${user.societyName}. The backend scopes this list to your own society for every role, including Super Admin.`}
        action={
          <Button href="/admin/dashboard/users/new" variant="primary">
            <Plus size={16} strokeWidth={2} />
            Add user
          </Button>
        }
      />

      <div className="max-w-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput);
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1">
            <Input
              id="user-search"
              label="Search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name, email or phone"
            />
          </div>
          <Button type="submit" variant="secondary" className="!border-ink/20 !text-ink hover:!border-brass hover:!text-brass">
            <Search size={16} strokeWidth={2} />
          </Button>
        </form>
      </div>

      {error && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Contact</th>
              <th className="px-5 py-3 font-medium">Flat</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows === null && !error && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink/40">
                  Loading users…
                </td>
              </tr>
            )}
            {rows !== null && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink/40">
                  No users found.
                </td>
              </tr>
            )}
            {rows?.map((member) => {
              const flat = member.flatId ? flatsById.get(member.flatId) : undefined;
              return (
                <tr key={member.id} className="transition-colors hover:bg-ink/[0.02]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-xs text-brass">
                        {initialsFromName(member.name)}
                      </span>
                      <span className="font-medium text-ink">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-ink/60">
                    <div className="flex flex-col">
                      <span>{member.email || "—"}</span>
                      <span className="text-xs text-ink/40">{member.phone || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-ink/60">
                    {flat ? `${flat.block} · ${flat.unit_no}` : member.flatId ? `#${member.flatId}` : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={member.isActive ? "sage" : "muted"}>
                      {member.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/dashboard/users/${member.id}/edit`}
                        aria-label={`Edit ${member.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                      >
                        <Pencil size={15} strokeWidth={1.75} />
                      </Link>
                      <ConfirmDeleteButton label={member.name} onConfirm={() => handleDelete(member)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink/50">
          <span>
            Page {page} of {totalPages} · {total} user{total === 1 ? "" : "s"}
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

export default function UsersListPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <UsersListContent />
    </RequireRole>
  );
}
