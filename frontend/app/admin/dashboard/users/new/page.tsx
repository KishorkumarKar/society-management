"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import UserForm from "@/components/admin/forms/UserForm";
import Card from "@/components/ui/Card";
import RequireRole from "@/components/admin/RequireRole";

function NewUserContent() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Add user"
        description="Create a login for someone in your society. Roles can be assigned now or later."
      />
      <Card className="max-w-2xl p-8">
        <UserForm
          submitLabel="Create user"
          onCreated={() => router.push("/admin/dashboard/users")}
        />
      </Card>
    </div>
  );
}

export default function NewUserPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <NewUserContent />
    </RequireRole>
  );
}
