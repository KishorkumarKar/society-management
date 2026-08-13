"use client";

import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { useData } from "@/context/DataContext";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function SocietiesListContent() {
  const { societies, deleteSociety } = useData();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Societies"
        description="Every society running on the SocietyLedger network."
        action={
          <Button href="/admin/dashboard/societies/new" variant="primary">
            <Plus size={16} strokeWidth={2} />
            Add society
          </Button>
        }
      />

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.03] font-mono text-[11px] uppercase tracking-wider text-ink/50">
              <th className="px-5 py-3 font-medium">Society</th>
              <th className="px-5 py-3 font-medium">City</th>
              <th className="px-5 py-3 font-medium">Units</th>
              <th className="px-5 py-3 font-medium">Established</th>
              <th className="px-5 py-3 font-medium">Registration No.</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {societies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink/40">
                  No societies yet.
                </td>
              </tr>
            )}
            {societies.map((society) => (
              <tr key={society.id} className="transition-colors hover:bg-ink/[0.02]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-xs text-brass">
                      {society.initial}
                    </span>
                    <span className="font-medium text-ink">{society.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-ink/60">{society.city}</td>
                <td className="px-5 py-4 text-ink/60">
                  {society.occupiedUnits}/{society.totalUnits}
                </td>
                <td className="px-5 py-4 text-ink/60">{society.established}</td>
                <td className="px-5 py-4 font-mono text-xs text-ink/50">{society.registrationNo}</td>
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
                      label={`${society.name} (and its users & notices)`}
                      onConfirm={() => deleteSociety(society.id)}
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

export default function SocietiesListPage() {
  return (
    <RequireRole roles={["super-admin"]}>
      <SocietiesListContent />
    </RequireRole>
  );
}
