"use client";

import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import ExpenseForm from "@/components/admin/forms/ExpenseForm";
import Card from "@/components/ui/Card";
import RequireRole from "@/components/admin/RequireRole";

function NewEventExpenseContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { addExpense } = useData();

  return (
    <Card className="max-w-2xl p-8">
      <ExpenseForm
        fixedEventId={id}
        submitLabel="Add expense"
        onSubmit={(input) => {
          addExpense(input);
          router.push(`/admin/dashboard/events/${id}/expenses`);
        }}
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
