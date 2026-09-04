"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEventCollection, deleteEventCollection } from "@/lib/api/eventCollections";
import type { BackendEventCollection } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import CollectionForm from "@/components/admin/forms/CollectionForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import RequireRole from "@/components/admin/RequireRole";

function EditEventCollectionContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? Number(params.id) : NaN;
  const collectionId = typeof params.collectionId === "string" ? Number(params.collectionId) : NaN;
  const router = useRouter();

  const [existing, setExisting] = useState<BackendEventCollection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(collectionId)) return;
    getEventCollection(collectionId)
      .then(setExisting)
      .catch((err) =>
        setLoadError(
          err instanceof ApiError || err instanceof ApiNetworkError
            ? err.message
            : "This collection entry may have already been removed."
        )
      );
  }, [collectionId]);

  async function handleDelete() {
    try {
      await deleteEventCollection(collectionId);
      router.push(`/admin/dashboard/events/${id}/collections`);
    } catch {
      // Swallow — the delete button's own confirm affordance is the only
      // feedback surface here; a failure just leaves the row in place.
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-ink/50">{loadError}</p>
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

  if (!existing) {
    return <div className="py-16 text-center text-ink/40">Loading…</div>;
  }

  return (
    <Card className="max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-lg text-ink">Edit collection entry</h2>
        <ConfirmDeleteButton label={`${existing.member_name}'s collection entry`} onConfirm={handleDelete} />
      </div>
      <CollectionForm
        eventId={id}
        initial={existing}
        submitLabel="Save changes"
        onSaved={() => router.push(`/admin/dashboard/events/${id}/collections`)}
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
