"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExpense, deleteExpense } from "@/lib/api/expenses";
import type { BackendExpense } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import SocietyExpenseForm from "@/components/admin/forms/SocietyExpenseForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError || err instanceof ApiNetworkError ? err.message : fallback;
}

function EditExpenseContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? Number(params.id) : NaN;
  const router = useRouter();

  const [expense, setExpense] = useState<BackendExpense | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid expense id.");
      return;
    }
    getExpense(id)
      .then(setExpense)
      .catch((err) => setLoadError(errorMessage(err, "This expense may have already been removed.")));
  }, [id]);

  async function handleDelete() {
    try {
      await deleteExpense(id);
      router.push("/admin/dashboard/expenses");
    } catch (err) {
      setActionError(errorMessage(err, "Couldn't delete this expense."));
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Expense not found" description={loadError} />
        <Button
          href="/admin/dashboard/expenses"
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to expenses
        </Button>
      </div>
    );
  }

  if (!expense) {
    return <div className="py-16 text-center text-ink/40">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Edit ${expense.category} expense`}
        description="Approving or rejecting is done from the list page, not here."
        action={<ConfirmDeleteButton label={`the ${expense.category} expense`} onConfirm={handleDelete} />}
      />
      {actionError && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {actionError}
        </p>
      )}
      <Card className="max-w-2xl p-8">
        <SocietyExpenseForm
          initial={expense}
          submitLabel="Save changes"
          onSaved={() => router.push("/admin/dashboard/expenses")}
        />
      </Card>
    </div>
  );
}

export default function EditExpensePage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <EditExpenseContent />
    </RequireRole>
  );
}
