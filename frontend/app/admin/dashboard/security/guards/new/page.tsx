"use client";

import { useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import GuardForm from "@/components/admin/forms/GuardForm";
import Card from "@/components/ui/Card";

function NewGuardContent() {
  const router = useRouter();
  const { addGuard } = useData();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Add security guard" description="Add a new guard to the roster." />
      <Card className="max-w-2xl p-8">
        <GuardForm
          submitLabel="Add guard"
          onSubmit={(input) => {
            addGuard(input);
            router.push("/admin/dashboard/security/guards");
          }}
        />
      </Card>
    </div>
  );
}

export default function NewGuardPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <NewGuardContent />
    </RequireRole>
  );
}
