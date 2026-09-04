"use client";

import { useParams, useRouter } from "next/navigation";
import ExpenseForm from "@/components/admin/forms/ExpenseForm";
import Card from "@/components/ui/Card";
import RequireRole from "@/components/admin/RequireRole";

function NewEventExpenseContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? Number(params.id) : NaN;
  const router = useRouter();

  return (
    <Card className="max-w-2xl p-8">
      <ExpenseForm
        eventId={id}
        submitLabel="Add expense"
        onSaved={() => router.push(`/admin/dashboard/events/${id}/expenses`)}
      />
    </Card>
  );
}

export default function NewEventExpensePage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <NewEventExpenseContent />
    </RequireRole>
  );
}
