"use client";

import { useRouter } from "next/navigation";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import MaintenanceBillForm from "@/components/admin/forms/MaintenanceBillForm";
import Card from "@/components/ui/Card";

function NewMaintenanceBillContent() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Add bill" description="Raise a maintenance bill for a flat." />
      <Card className="max-w-2xl p-8">
        <MaintenanceBillForm
          submitLabel="Create bill"
          onSaved={(bill) => router.push(`/admin/dashboard/maintenance/${bill.id}/edit`)}
        />
      </Card>
    </div>
  );
}

export default function NewMaintenanceBillPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <NewMaintenanceBillContent />
    </RequireRole>
  );
}
