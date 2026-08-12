"use client";

import { useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import SocietyForm from "@/components/admin/forms/SocietyForm";
import Card from "@/components/ui/Card";

function NewSocietyContent() {
  const router = useRouter();
  const { addSociety } = useData();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Add society" description="Onboard a new society onto the network." />
      <Card className="max-w-2xl p-8">
        <SocietyForm
          submitLabel="Create society"
          onSubmit={(input) => {
            addSociety(input);
            router.push("/admin/dashboard/societies");
          }}
        />
      </Card>
    </div>
  );
}

export default function NewSocietyPage() {
  return (
    <RequireRole roles={["super-admin"]}>
      <NewSocietyContent />
    </RequireRole>
  );
}
