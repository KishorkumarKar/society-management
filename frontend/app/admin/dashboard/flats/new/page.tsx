"use client";

import { useRouter } from "next/navigation";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import FlatForm from "@/components/admin/forms/FlatForm";
import Card from "@/components/ui/Card";

function NewFlatContent() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Add flat" description="Register a new unit in your society." />
      <Card className="max-w-2xl p-8">
        <FlatForm submitLabel="Create flat" onSaved={() => router.push("/admin/dashboard/flats")} />
      </Card>
    </div>
  );
}

export default function NewFlatPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <NewFlatContent />
    </RequireRole>
  );
}
