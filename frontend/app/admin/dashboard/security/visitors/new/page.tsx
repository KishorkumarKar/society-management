"use client";

import { useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import VisitorForm from "@/components/admin/forms/VisitorForm";
import Card from "@/components/ui/Card";

function NewVisitorContent() {
  const router = useRouter();
  const { addVisitor } = useData();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Register visitor" description="Log a visitor entering the society." />
      <Card className="max-w-2xl p-8">
        <VisitorForm
          submitLabel="Save visitor entry"
          onSubmit={(input) => {
            const created = addVisitor(input);
            router.push(`/admin/dashboard/security/visitors/${created.id}`);
          }}
        />
      </Card>
    </div>
  );
}

export default function NewVisitorPage() {
  return (
    <RequireRole roles={["admin", "super-admin", "security"]}>
      <NewVisitorContent />
    </RequireRole>
  );
}
