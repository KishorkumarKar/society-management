"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { useData } from "@/context/DataContext";
import { findSocietyById, shiftStatusTone } from "@/lib/data";
import RequireRole from "@/components/admin/RequireRole";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

function ViewShiftContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { shifts, guards, societies } = useData();

  const shift = shifts.find((s) => s.id === id);

  if (!shift) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-ink/50">This shift may have already been removed.</p>
        <Button
          href="/admin/dashboard/security/shifts"
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to shifts
        </Button>
      </div>
    );
  }

  const society = findSocietyById(societies, shift.societyId);
  const guard = guards.find((g) => g.id === shift.guardId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/dashboard/security/shifts"
          className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink/50 transition-colors hover:text-brass"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back to shifts
        </Link>
        <Button
          href={`/admin/dashboard/security/shifts/${shift.id}/edit`}
          variant="secondary"
          className="!border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          <Pencil size={15} strokeWidth={1.75} />
          Edit
        </Button>
      </div>

      <Card className="flex max-w-2xl flex-col gap-6 p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-display text-2xl text-ink">{shift.shiftName}</span>
            <span className="text-sm text-ink/50">{shift.shiftType.replace("_", " ")} shift</span>
          </div>
          <Badge tone={shiftStatusTone(shift.status)}>{shift.status}</Badge>
        </div>

        <div className="flex items-center gap-4 rounded-sm border border-brass/20 bg-brass/[0.06] p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-sm text-brass">
            {guard?.name.slice(0, 1) ?? "?"}
          </span>
          <div className="flex flex-col">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Assigned guard</span>
            <span className="text-sm font-medium text-ink">{guard?.name ?? "Unassigned"}</span>
            {guard && <span className="text-xs text-ink/50">{guard.employeeCode} · {guard.phone}</span>}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-6 border-t border-ink/10 pt-6 text-sm">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Shift date</dt>
            <dd className="mt-1 text-ink">{shift.shiftDate || "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Time</dt>
            <dd className="mt-1 text-ink">
              {shift.startTime} – {shift.endTime} ({shift.durationHours}h)
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Society</dt>
            <dd className="mt-1 text-ink">{society?.name ?? "—"}</dd>
          </div>
        </dl>

        {shift.remarks && (
          <div className="border-t border-ink/10 pt-6">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Remarks</dt>
            <dd className="mt-2 text-sm leading-relaxed text-ink/70">{shift.remarks}</dd>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ViewShiftPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <ViewShiftContent />
    </RequireRole>
  );
}
