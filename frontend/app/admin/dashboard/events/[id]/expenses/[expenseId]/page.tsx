"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { canManage } from "@/lib/data";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function ViewEventExpensePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const expenseId = typeof params.expenseId === "string" ? params.expenseId : "";
  const { user } = useAuth();
  const { expenses } = useData();
  const isManager = !!user && canManage(user.role);

  const expense = expenses.find((e) => e.id === expenseId);

  if (!expense) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-ink/50">This expense may have already been removed.</p>
        <Button
          href={`/admin/dashboard/events/${id}/expenses`}
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to expenses
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/dashboard/events/${id}/expenses`}
          className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink/50 transition-colors hover:text-brass"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back to expenses
        </Link>
        {isManager && (
          <Button
            href={`/admin/dashboard/events/${id}/expenses/${expense.id}/edit`}
            variant="secondary"
            className="!border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
          >
            <Pencil size={15} strokeWidth={1.75} />
            Edit
          </Button>
        )}
      </div>

      <Card className="flex max-w-2xl flex-col gap-6 p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-display text-2xl text-ink">{expense.title}</span>
            <span className="text-sm text-ink/50">{expense.paidTo || "No vendor recorded"}</span>
          </div>
          <Badge tone="muted">{expense.category}</Badge>
        </div>

        <dl className="grid grid-cols-2 gap-6 border-t border-ink/10 pt-6 text-sm">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Amount</dt>
            <dd className="mt-1 text-ink">₹{expense.amount.toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Date</dt>
            <dd className="mt-1 text-ink">{expense.date || "—"}</dd>
          </div>
        </dl>

        {expense.notes && (
          <div className="border-t border-ink/10 pt-6">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Notes</dt>
            <dd className="mt-2 text-sm leading-relaxed text-ink/70">{expense.notes}</dd>
          </div>
        )}
      </Card>
    </div>
  );
}
