"use client";

import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import SocietyForm from "@/components/admin/forms/SocietyForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function EditSocietyContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { societies, updateSociety, deleteSociety } = useData();

  const existing = societies.find((s) => s.id === id);

  if (!existing) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Society not found" description="This society may have already been removed." />
        <Button href="/admin/dashboard/societies" variant="secondary" className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass">
          Back to societies
        </Button>
      </div>
    );
  }

  function handleDelete() {
    deleteSociety(existing!.id);
    router.push("/admin/dashboard/societies");
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Edit ${existing.name}`}
        description="Deleting a society also removes its users and notices."
        action={<ConfirmDeleteButton label={existing.name} onConfirm={handleDelete} />}
      />
      <Card className="max-w-2xl p-8">
        <SocietyForm
          initial={existing}
          submitLabel="Save changes"
          onSubmit={(input) => {
            updateSociety(existing.id, input);
            router.push("/admin/dashboard/societies");
          }}
        />
      </Card>
    </div>
  );
}

export default function EditSocietyPage() {
  return (
    <RequireRole roles={["super-admin"]}>
      <EditSocietyContent />
    </RequireRole>
  );
}
