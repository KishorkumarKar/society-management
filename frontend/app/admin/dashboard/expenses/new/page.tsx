"use client";

import { useRouter } from "next/navigation";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import SocietyExpenseForm from "@/components/admin/forms/SocietyExpenseForm";
import Card from "@/components/ui/Card";

function NewExpenseContent() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Add expense" description="Record a society expense." />
      <Card className="max-w-2xl p-8">
        <SocietyExpenseForm
          submitLabel="Create expense"
          onSaved={() => router.push("/admin/dashboard/expenses")}
        />
      </Card>
    </div>
  );
}

export default function NewExpensePage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <NewExpenseContent />
    </RequireRole>
  );
}
