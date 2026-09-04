"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import { listSocieties, deleteSociety } from "@/lib/api/societies";
import type { BackendSociety } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const PAGE_SIZE = 20;

function initialsOf(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatRate(society: BackendSociety): string {
  const rate = Number(society.rate_per_sqft) || 0;
  return society.rate_type === "FIXED" ? `₹${rate} fixed` : `₹${rate}/sq.ft.`;
}

function SocietiesListContent() {
  const [rows, setRows] = useState<BackendSociety[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listSocieties({ page, limit: PAGE_SIZE, search: search || undefined, sort: "-created_at" })
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
            : "Couldn't load societies right now."
        );
      });
    return () => {
      cancelled = true;
    };
  }, [page, search]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  async function handleDelete(target: BackendSociety) {
    try {
      await deleteSociety(target.id);
      setRows((prev) => (prev ? prev.filter((s) => s.id !== target.id) : prev));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't delete this society."
      );
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Societies"
        description="Every society running on the network — the only cross-society view in this app, since /societies isn't tenant-scoped."
        action={
          <Button href="/admin/dashboard/societies/new" variant="primary">
            <Plus size={16} strokeWidth={2} />
            Add society
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
              id="society-search"
              label="Search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Society name"
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
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Society</th>
              <th className="px-5 py-3 font-medium">City</th>
              <th className="px-5 py-3 font-medium">Login code</th>
              <th className="px-5 py-3 font-medium">Maintenance rate</th>
              <th className="px-5 py-3 font-medium">Registration No.</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows === null && !error && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink/40">
                  Loading societies…
                </td>
              </tr>
            )}
            {rows !== null && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink/40">
                  No societies yet.
                </td>
              </tr>
            )}
            {rows?.map((society) => (
              <tr key={society.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-xs text-brass">
                      {initialsOf(society.name)}
                    </span>
                    <span className="font-medium text-ink">{society.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-ink/60">{society.city}</td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">{society.slug}</td>
                <td className="px-5 py-4 text-ink/60">{formatRate(society)}</td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">{society.registration_no ?? "—"}</td>
                <td className="px-5 py-4">
                  <Badge tone={society.status === 1 ? "sage" : "muted"}>
                    {society.status === 1 ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/dashboard/societies/${society.id}/edit`}
                      aria-label={`Edit ${society.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                    >
                      <Pencil size={15} strokeWidth={1.75} />
                    </Link>
                    <ConfirmDeleteButton
                      label={`${society.name} (and its users, flats & notices)`}
                      onConfirm={() => handleDelete(society)}
                    />
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
            Page {page} of {totalPages} · {total} societ{total === 1 ? "y" : "ies"}
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

export default function SocietiesListPage() {
  return (
    <RequireRole roles={["super-admin"]}>
      <SocietiesListContent />
    </RequireRole>
  );
}
