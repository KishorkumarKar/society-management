"use client";

import { useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import PageHeader from "@/components/admin/PageHeader";
import EventForm from "@/components/admin/forms/EventForm";
import Card from "@/components/ui/Card";
import RequireRole from "@/components/admin/RequireRole";

function NewEventContent() {
  const router = useRouter();
  const { addEvent } = useData();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Add event" description="Create an event to start tracking collections and expenses for it." />
      <Card className="max-w-2xl p-8">
        <EventForm
          submitLabel="Create event"
          onSubmit={(input) => {
            const created = addEvent(input);
            router.push(`/admin/dashboard/events/${created.id}`);
          }}
        />
      </Card>
    </div>
  );
}

export default function NewEventPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <NewEventContent />
    </RequireRole>
  );
}
