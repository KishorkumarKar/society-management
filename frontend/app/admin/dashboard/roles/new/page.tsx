"use client";

import { useRouter } from "next/navigation";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import RoleForm from "@/components/admin/forms/RoleForm";
import Card from "@/components/ui/Card";

function NewRoleContent() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Add role"
        description="Create a role, then assign it permissions and give it to users."
      />
      <Card className="max-w-2xl p-8">
        <RoleForm
          submitLabel="Create role"
          onSaved={(role) => router.push(`/admin/dashboard/roles/${role.id}/edit`)}
        />
      </Card>
    </div>
  );
}

export default function NewRolePage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <NewRoleContent />
    </RequireRole>
  );
}
