"use client";

import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import EventForm from "@/components/admin/forms/EventForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import RequireRole from "@/components/admin/RequireRole";

function EditEventContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { events, updateEvent, deleteEvent } = useData();

  const existing = events.find((e) => e.id === id);

  if (!existing) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Event not found" description="This event may have already been removed." />
        <Button href="/admin/dashboard/events" variant="secondary" className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass">
          Back to events
        </Button>
      </div>
    );
  }

  function handleDelete() {
    deleteEvent(existing!.id);
    router.push("/admin/dashboard/events");
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Edit ${existing.name}`}
        description="Deleting an event also removes its collections and expenses."
        action={<ConfirmDeleteButton label={existing.name} onConfirm={handleDelete} />}
      />
      <Card className="max-w-2xl p-8">
        <EventForm
          initial={existing}
          submitLabel="Save changes"
          onSubmit={(input) => {
            updateEvent(existing.id, input);
            router.push(`/admin/dashboard/events/${existing.id}`);
          }}
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
