"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import { listFlats, deleteFlat } from "@/lib/api/flats";
import { listUsers } from "@/lib/api/users";
import type { BackendFlat, BackendUser } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const PAGE_SIZE = 20;

function formatMoney(value: string | number | null): string {
  if (value == null) return "—";
  const n = Number(value);
  return Number.isFinite(n) ? `₹${n.toLocaleString("en-IN")}` : "—";
}

function FlatsListContent() {
  const [rows, setRows] = useState<BackendFlat[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ownersById, setOwnersById] = useState<Map<number, BackendUser>>(new Map());

  useEffect(() => {
    listUsers({ limit: 100 })
      .then((res) => setOwnersById(new Map(res.data.map((u) => [u.id, u]))))
      .catch(() => {
        // Owner names are a nice-to-have; a failed fetch just leaves the
        // owner column showing the raw id.
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    listFlats({ page, limit: PAGE_SIZE, search: search || undefined, sort: "-created_at" })
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
            : "Couldn't load flats right now."
        );
      });
    return () => {
      cancelled = true;
    };
  }, [page, search]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  async function handleDelete(target: BackendFlat) {
    try {
      await deleteFlat(target.id);
      setRows((prev) => (prev ? prev.filter((f) => f.id !== target.id) : prev));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't delete this flat."
      );
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Flats"
        description="Units in your society — used for member unit assignment and maintenance billing."
        action={
          <Button href="/admin/dashboard/flats/new" variant="primary">
            <Plus size={16} strokeWidth={2} />
            Add flat
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
              id="flat-search"
              label="Search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Block or unit number"
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
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Unit</th>
              <th className="px-5 py-3 font-medium">Floor</th>
              <th className="px-5 py-3 font-medium">Owner</th>
              <th className="px-5 py-3 font-medium">Area</th>
              <th className="px-5 py-3 font-medium">Rate</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows === null && !error && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/40">
                  Loading flats…
                </td>
              </tr>
            )}
            {rows !== null && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/40">
                  No flats yet.
                </td>
              </tr>
            )}
            {rows?.map((flat) => {
              const owner = flat.owner_id ? ownersById.get(flat.owner_id) : undefined;
              return (
                <tr key={flat.id} className="transition-colors hover:bg-ink/[0.02]">
                  <td className="px-5 py-4">
                    <span className="font-medium text-ink">
                      {flat.block} · {flat.unit_no}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-ink/60">{flat.floor}</td>
                  <td className="px-5 py-4 text-ink/60">
                    {owner ? owner.name : flat.owner_id ? `#${flat.owner_id}` : "—"}
                  </td>
                  <td className="px-5 py-4 text-ink/60">
                    {flat.sqft ? `${Number(flat.sqft).toLocaleString("en-IN")} sq.ft.` : "—"}
                  </td>
                  <td className="px-5 py-4 text-ink/60">
                    {flat.fix_price != null
                      ? `${formatMoney(flat.fix_price)} fixed`
                      : flat.price_per_sqft != null
                        ? `${formatMoney(flat.price_per_sqft)}/sq.ft.`
                        : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/dashboard/flats/${flat.id}/edit`}
                        aria-label={`Edit ${flat.block} ${flat.unit_no}`}
                        className="flex h-8 w-8 items-center justify-center rounded-sm border border-ink/10 text-ink/50 transition-colors hover:border-brass hover:text-brass"
                      >
                        <Pencil size={15} strokeWidth={1.75} />
                      </Link>
                      <ConfirmDeleteButton
                        label={`${flat.block} ${flat.unit_no}`}
                        onConfirm={() => handleDelete(flat)}
                      />
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
            Page {page} of {totalPages} · {total} flat{total === 1 ? "" : "s"}
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

export default function FlatsListPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <FlatsListContent />
    </RequireRole>
  );
}
