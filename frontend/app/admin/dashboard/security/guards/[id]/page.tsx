"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { useData } from "@/context/DataContext";
import { findSocietyById, shiftsBySociety, guardStatusTone, shiftStatusTone } from "@/lib/data";
import RequireRole from "@/components/admin/RequireRole";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

function ViewGuardContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { guards, societies, shifts } = useData();

  const guard = guards.find((g) => g.id === id);

  if (!guard) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-ink/50">This guard may have already been removed.</p>
        <Button
          href="/admin/dashboard/security/guards"
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to guards
        </Button>
      </div>
    );
  }

  const society = findSocietyById(societies, guard.societyId);
  const guardShifts = shiftsBySociety(shifts, guard.societyId).filter((s) => s.guardId === guard.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/dashboard/security/guards"
          className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink/50 transition-colors hover:text-brass"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back to guards
        </Link>
        <Button
          href={`/admin/dashboard/security/guards/${guard.id}/edit`}
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
            <span className="font-display text-2xl text-ink">{guard.name}</span>
            <span className="font-mono text-sm text-ink/50">{guard.employeeCode}</span>
          </div>
          <Badge tone={guardStatusTone(guard.status)}>{guard.status}</Badge>
        </div>

        <dl className="grid grid-cols-2 gap-6 border-t border-ink/10 pt-6 text-sm">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Phone</dt>
            <dd className="mt-1 text-ink">{guard.phone || "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Joining date</dt>
            <dd className="mt-1 text-ink">{guard.joiningDate || "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Society</dt>
            <dd className="mt-1 text-ink">{society?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Address</dt>
            <dd className="mt-1 text-ink">{guard.address || "—"}</dd>
          </div>
        </dl>
      </Card>

      <div className="flex max-w-2xl flex-col gap-4">
        <h2 className="font-display text-lg text-ink">Assigned shifts</h2>
        <Card className="divide-y divide-ink/10 p-0">
          {guardShifts.length === 0 && (
            <p className="p-5 text-sm text-ink/50">No shifts assigned to this guard yet.</p>
          )}
          {guardShifts.map((shift) => (
            <div key={shift.id} className="flex items-center justify-between gap-4 p-5">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-ink">{shift.shiftName}</span>
                <span className="text-xs text-ink/50">
                  {shift.shiftDate} · {shift.startTime}–{shift.endTime}
                </span>
              </div>
              <Badge tone={shiftStatusTone(shift.status)}>{shift.status}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export default function ViewGuardPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <ViewGuardContent />
    </RequireRole>
  );
}
