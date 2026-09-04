"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getHallBooking, deleteHallBooking } from "@/lib/api/hallBookings";
import type { BackendHallBooking } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import HallBookingForm from "@/components/admin/forms/HallBookingForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError || err instanceof ApiNetworkError ? err.message : fallback;
}

function EditHallBookingContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? Number(params.id) : NaN;
  const router = useRouter();

  const [booking, setBooking] = useState<BackendHallBooking | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid booking id.");
      return;
    }
    getHallBooking(id)
      .then(setBooking)
      .catch((err) => setLoadError(errorMessage(err, "This booking may have already been removed.")));
  }, [id]);

  async function handleDelete() {
    try {
      await deleteHallBooking(id);
      router.push("/admin/dashboard/hall-bookings");
    } catch (err) {
      setActionError(errorMessage(err, "Couldn't delete this booking."));
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Booking not found" description={loadError} />
        <Button
          href="/admin/dashboard/hall-bookings"
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to hall bookings
        </Button>
      </div>
    );
  }

  if (!booking) {
    return <div className="py-16 text-center text-ink/40">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Edit ${booking.hall_name} booking`}
        description="Approving, rejecting, or cancelling a booking is done from the list page, not here."
        action={<ConfirmDeleteButton label={`the ${booking.hall_name} booking`} onConfirm={handleDelete} />}
      />
      {actionError && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {actionError}
        </p>
      )}
      <Card className="max-w-2xl p-8">
        <HallBookingForm
          initial={booking}
          submitLabel="Save changes"
          onSaved={() => router.push("/admin/dashboard/hall-bookings")}
        />
      </Card>
    </div>
  );
}

export default function EditHallBookingPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <EditHallBookingContent />
    </RequireRole>
  );
}
