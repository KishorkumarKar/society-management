"use client";

import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import UserForm from "@/components/admin/forms/UserForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import RequireRole from "@/components/admin/RequireRole";

function EditUserContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { users, updateUser, deleteUser } = useData();

  const existing = users.find((u) => u.id === id);

  if (!existing) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="User not found" description="This user may have already been removed." />
        <Button href="/admin/dashboard/users" variant="secondary" className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass">
          Back to users
        </Button>
      </div>
    );
  }

  function handleDelete() {
    deleteUser(existing!.id);
    router.push("/admin/dashboard/users");
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Edit ${existing.name}`}
        description="Update this member's details."
        action={<ConfirmDeleteButton label={existing.name} onConfirm={handleDelete} />}
      />
      <Card className="max-w-2xl p-8">
        <UserForm
          initial={existing}
          submitLabel="Save changes"
          onSubmit={(input) => {
            updateUser(existing.id, input);
            router.push("/admin/dashboard/users");
          }}
        />
      </Card>
    </div>
  );
}

export default function EditUserPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <EditUserContent />
    </RequireRole>
  );
}
