"use client";

import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import ShiftForm from "@/components/admin/forms/ShiftForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function EditShiftContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { shifts, updateShift, deleteShift } = useData();

  const existing = shifts.find((s) => s.id === id);

  if (!existing) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Shift not found" description="This shift may have already been removed." />
        <Button href="/admin/dashboard/security/shifts" variant="secondary" className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass">
          Back to shifts
        </Button>
      </div>
    );
  }

  function handleDelete() {
    deleteShift(existing!.id);
    router.push("/admin/dashboard/security/shifts");
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Edit ${existing.shiftName}`}
        action={<ConfirmDeleteButton label={existing.shiftName} onConfirm={handleDelete} />}
      />
      <Card className="max-w-2xl p-8">
        <ShiftForm
          initial={existing}
          submitLabel="Save changes"
          onSubmit={(input) => {
            updateShift(existing.id, input);
            router.push("/admin/dashboard/security/shifts");
          }}
        />
      </Card>
    </div>
  );
}

export default function EditShiftPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <EditShiftContent />
    </RequireRole>
  );
}
