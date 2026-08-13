"use client";

import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import VisitorForm from "@/components/admin/forms/VisitorForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function EditVisitorContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { visitors, updateVisitor } = useData();

  const existing = visitors.find((v) => v.id === id);

  if (!existing) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Visitor not found" description="This visitor entry may have already been removed." />
        <Button
          href="/admin/dashboard/security/visitors"
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to visitors
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Edit ${existing.visitorName}`} description="Update this visitor entry's details." />
      <Card className="max-w-2xl p-8">
        <VisitorForm
          initial={existing}
          submitLabel="Save changes"
          onSubmit={(input) => {
            updateVisitor(existing.id, input);
            router.push(`/admin/dashboard/security/visitors/${existing.id}`);
          }}
        />
      </Card>
    </div>
  );
}

export default function EditVisitorPage() {
  return (
    <RequireRole roles={["admin", "super-admin", "security"]}>
      <EditVisitorContent />
    </RequireRole>
  );
}
