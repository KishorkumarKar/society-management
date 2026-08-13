"use client";

import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import CollectionForm from "@/components/admin/forms/CollectionForm";
import Card from "@/components/ui/Card";
import RequireRole from "@/components/admin/RequireRole";

function NewEventCollectionContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { addCollection } = useData();

  return (
    <Card className="max-w-2xl p-8">
      <CollectionForm
        fixedEventId={id}
        submitLabel="Add collection entry"
        onSubmit={(input) => {
          addCollection(input);
          router.push(`/admin/dashboard/events/${id}/collections`);
        }}
      />
    </Card>
  );
}

export default function NewEventCollectionPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <NewEventCollectionContent />
    </RequireRole>
  );
}
