"use client";

import { useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ShiftForm from "@/components/admin/forms/ShiftForm";
import Card from "@/components/ui/Card";

function NewShiftContent() {
  const router = useRouter();
  const { addShift } = useData();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Create shift" description="Schedule a guard for a shift." />
      <Card className="max-w-2xl p-8">
        <ShiftForm
          submitLabel="Create shift"
          onSubmit={(input) => {
            addShift(input);
            router.push("/admin/dashboard/security/shifts");
          }}
        />
      </Card>
    </div>
  );
}

export default function NewShiftPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <NewShiftContent />
    </RequireRole>
  );
}
