"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEventExpense, deleteEventExpense } from "@/lib/api/eventExpenses";
import type { BackendEventExpense } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import ExpenseForm from "@/components/admin/forms/ExpenseForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import RequireRole from "@/components/admin/RequireRole";

function EditEventExpenseContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? Number(params.id) : NaN;
  const expenseId = typeof params.expenseId === "string" ? Number(params.expenseId) : NaN;
  const router = useRouter();

  const [existing, setExisting] = useState<BackendEventExpense | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(expenseId)) return;
    getEventExpense(expenseId)
      .then(setExisting)
      .catch((err) =>
        setLoadError(
          err instanceof ApiError || err instanceof ApiNetworkError
            ? err.message
            : "This expense may have already been removed."
        )
      );
  }, [expenseId]);

  async function handleDelete() {
    try {
      await deleteEventExpense(expenseId);
      router.push(`/admin/dashboard/events/${id}/expenses`);
    } catch {
      // Swallow — the confirm button is the only feedback surface here.
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-ink/50">{loadError}</p>
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

  if (!existing) {
    return <div className="py-16 text-center text-ink/40">Loading…</div>;
  }

  return (
    <Card className="max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-lg text-ink">Edit expense</h2>
        <ConfirmDeleteButton label={existing.title} onConfirm={handleDelete} />
      </div>
      <ExpenseForm
        eventId={id}
        initial={existing}
        submitLabel="Save changes"
        onSaved={() => router.push(`/admin/dashboard/events/${id}/expenses`)}
      />
    </Card>
  );
}

export default function EditEventExpensePage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <EditEventExpenseContent />
    </RequireRole>
  );
}
