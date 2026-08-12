"use client";

import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import ExpenseForm from "@/components/admin/forms/ExpenseForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import RequireRole from "@/components/admin/RequireRole";

function EditEventExpenseContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const expenseId = typeof params.expenseId === "string" ? params.expenseId : "";
  const router = useRouter();
  const { expenses, updateExpense, deleteExpense } = useData();

  const existing = expenses.find((e) => e.id === expenseId);

  if (!existing) {
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

  function handleDelete() {
    deleteExpense(existing!.id);
    router.push(`/admin/dashboard/events/${id}/expenses`);
  }

  return (
    <Card className="max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-lg text-ink">Edit expense</h2>
        <ConfirmDeleteButton label={existing.title} onConfirm={handleDelete} />
      </div>
      <ExpenseForm
        initial={existing}
        fixedEventId={id}
        submitLabel="Save changes"
        onSubmit={(input) => {
          updateExpense(existing.id, input);
          router.push(`/admin/dashboard/events/${id}/expenses`);
        }}
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
