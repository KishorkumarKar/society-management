"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import EventForm from "@/components/admin/forms/EventForm";
import Card from "@/components/ui/Card";
import RequireRole from "@/components/admin/RequireRole";

function NewEventContent() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Add event" description="Create an event for your society." />
      <Card className="max-w-2xl p-8">
        <EventForm submitLabel="Create event" onSaved={() => router.push("/admin/dashboard/events")} />
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
