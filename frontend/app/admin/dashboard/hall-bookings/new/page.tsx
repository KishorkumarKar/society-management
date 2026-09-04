"use client";

import { useRouter } from "next/navigation";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import HallBookingForm from "@/components/admin/forms/HallBookingForm";
import Card from "@/components/ui/Card";

function NewHallBookingContent() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Add booking" description="Request a shared space for a flat in your society." />
      <Card className="max-w-2xl p-8">
        <HallBookingForm
          submitLabel="Create booking"
          onSaved={() => router.push("/admin/dashboard/hall-bookings")}
        />
      </Card>
    </div>
  );
}

export default function NewHallBookingPage() {
  return (
    <RequireRole roles={["admin", "super-admin", "resident"]}>
      <NewHallBookingContent />
    </RequireRole>
  );
}
