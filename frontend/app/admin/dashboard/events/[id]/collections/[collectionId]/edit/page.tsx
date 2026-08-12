"use client";

import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import CollectionForm from "@/components/admin/forms/CollectionForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import RequireRole from "@/components/admin/RequireRole";

function EditEventCollectionContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const collectionId = typeof params.collectionId === "string" ? params.collectionId : "";
  const router = useRouter();
  const { collections, updateCollection, deleteCollection } = useData();

  const existing = collections.find((c) => c.id === collectionId);

  if (!existing) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-ink/50">This collection entry may have already been removed.</p>
        <Button
          href={`/admin/dashboard/events/${id}/collections`}
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to collections
        </Button>
      </div>
    );
  }

  function handleDelete() {
    deleteCollection(existing!.id);
    router.push(`/admin/dashboard/events/${id}/collections`);
  }

  return (
    <Card className="max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-lg text-ink">Edit collection entry</h2>
        <ConfirmDeleteButton label={`${existing.memberName}'s collection entry`} onConfirm={handleDelete} />
      </div>
      <CollectionForm
        initial={existing}
        fixedEventId={id}
        submitLabel="Save changes"
        onSubmit={(input) => {
          updateCollection(existing.id, input);
          router.push(`/admin/dashboard/events/${id}/collections`);
        }}
      />
    </Card>
  );
}

export default function EditEventCollectionPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <EditEventCollectionContent />
    </RequireRole>
  );
}
