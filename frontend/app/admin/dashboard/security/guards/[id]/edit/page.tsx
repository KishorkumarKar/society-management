"use client";

import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import GuardForm from "@/components/admin/forms/GuardForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function EditGuardContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { guards, updateGuard, deleteGuard } = useData();

  const existing = guards.find((g) => g.id === id);

  if (!existing) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Guard not found" description="This guard may have already been removed." />
        <Button href="/admin/dashboard/security/guards" variant="secondary" className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass">
          Back to guards
        </Button>
      </div>
    );
  }

  function handleDelete() {
    deleteGuard(existing!.id);
    router.push("/admin/dashboard/security/guards");
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Edit ${existing.name}`}
        description="Deleting a guard also removes their scheduled shifts."
        action={<ConfirmDeleteButton label={existing.name} onConfirm={handleDelete} />}
      />
      <Card className="max-w-2xl p-8">
        <GuardForm
          initial={existing}
          submitLabel="Save changes"
          onSubmit={(input) => {
            updateGuard(existing.id, input);
            router.push("/admin/dashboard/security/guards");
          }}
        />
      </Card>
    </div>
  );
}

export default function EditGuardPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <EditGuardContent />
    </RequireRole>
  );
}
