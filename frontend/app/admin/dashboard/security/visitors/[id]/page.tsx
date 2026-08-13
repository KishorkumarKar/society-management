"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogOut, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { visitorStatusTone, canManage } from "@/lib/data";
import RequireRole from "@/components/admin/RequireRole";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

/**
 * Visitor Details is its own route so opening one visitor never pulls in
 * the full visitor list — only this one record (plus the small lookups
 * below) is fetched for the page.
 */
function ViewVisitorContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { user } = useAuth();
  const { visitors, users, markVisitorOut } = useData();
  const canEdit = !!user && (canManage(user.role) || user.role === "security");

  const visitor = visitors.find((v) => v.id === id);

  if (!visitor) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-ink/50">This visitor entry may have already been removed.</p>
        <Button
          href="/admin/dashboard/security/visitors"
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to visitors
        </Button>
      </div>
    );
  }

  const resident = users.find(
    (u) => u.societyId === visitor.societyId && u.unit === visitor.flatId
  );
  const creator = users.find((u) => u.id === visitor.createdBy);

  function handleMarkOut() {
    markVisitorOut(visitor!.id);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/dashboard/security/visitors"
          className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink/50 transition-colors hover:text-brass"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back to visitors
        </Link>
        <div className="flex items-center gap-2">
          {visitor.status === "in" && (
            <Button
              variant="secondary"
              onClick={handleMarkOut}
              className="!border-sage/40 !text-sage hover:!bg-sage/10"
            >
              <LogOut size={15} strokeWidth={1.75} />
              Mark out
            </Button>
          )}
          {canEdit && (
            <Button
              href={`/admin/dashboard/security/visitors/${visitor.id}/edit`}
              variant="secondary"
              className="!border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
            >
              <Pencil size={15} strokeWidth={1.75} />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Card className="flex max-w-2xl flex-col gap-6 p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-display text-2xl text-ink">{visitor.visitorName}</span>
            <span className="text-sm text-ink/50">{visitor.visitorType}</span>
          </div>
          <Badge tone={visitorStatusTone(visitor.status)}>
            {visitor.status === "in" ? "Currently inside" : "Out"}
          </Badge>
        </div>

        <dl className="grid grid-cols-2 gap-6 border-t border-ink/10 pt-6 text-sm">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Phone</dt>
            <dd className="mt-1 text-ink">{visitor.phone || "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Vehicle number</dt>
            <dd className="mt-1 text-ink">{visitor.vehicleNumber || "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Number of persons</dt>
            <dd className="mt-1 text-ink">{visitor.numberOfPersons}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Purpose</dt>
            <dd className="mt-1 text-ink">{visitor.purpose || "—"}</dd>
          </div>
        </dl>

        <div className="border-t border-ink/10 pt-6">
          <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Visiting</dt>
          <dd className="mt-1 text-sm text-ink">
            Unit {visitor.flatId}
            {resident && <span className="text-ink/50"> · {resident.name}</span>}
          </dd>
        </div>

        <dl className="grid grid-cols-2 gap-6 border-t border-ink/10 pt-6 text-sm">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">In</dt>
            <dd className="mt-1 text-ink">
              {visitor.inDate} {visitor.inTime}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Out</dt>
            <dd className="mt-1 text-ink">
              {visitor.status === "out" ? `${visitor.outDate} ${visitor.outTime}` : "Not yet"}
            </dd>
          </div>
        </dl>

        <div className="border-t border-ink/10 pt-6">
          <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Created by</dt>
          <dd className="mt-1 text-sm text-ink">{creator?.name ?? "—"}</dd>
        </div>

        {visitor.remarks && (
          <div className="border-t border-ink/10 pt-6">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Remarks</dt>
            <dd className="mt-2 text-sm leading-relaxed text-ink/70">{visitor.remarks}</dd>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ViewVisitorPage() {
  return (
    <RequireRole roles={["admin", "super-admin", "security"]}>
      <ViewVisitorContent />
    </RequireRole>
  );
}
