"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvent, deleteEvent } from "@/lib/api/events";
import type { BackendEvent } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import EventForm from "@/components/admin/forms/EventForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function EditEventContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? Number(params.id) : NaN;
  const router = useRouter();

  const [event, setEvent] = useState<BackendEvent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid event id.");
      return;
    }
    getEvent(id)
      .then(setEvent)
      .catch((err) =>
        setLoadError(
          err instanceof ApiError || err instanceof ApiNetworkError
            ? err.message
            : "This event may have already been removed."
        )
      );
  }, [id]);

  async function handleDelete() {
    try {
      await deleteEvent(id);
      router.push("/admin/dashboard/events");
    } catch (err) {
      setActionError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't delete this event."
      );
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Event not found" description={loadError} />
        <Button
          href="/admin/dashboard/events"
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to events
        </Button>
      </div>
    );
  }

  if (!event) {
    return <div className="py-16 text-center text-ink/40">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Edit ${event.name}`}
        description="Deleting an event also removes its collections and expenses."
        action={<ConfirmDeleteButton label={event.name} onConfirm={handleDelete} />}
      />
      {actionError && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {actionError}
        </p>
      )}
      <Card className="max-w-2xl p-8">
        <EventForm
          initial={event}
          submitLabel="Save changes"
          onSaved={() => router.push("/admin/dashboard/events")}
        />
      </Card>
    </div>
  );
}

export default function EditEventPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <EditEventContent />
    </RequireRole>
  );
}
