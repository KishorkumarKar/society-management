"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  createHallBooking,
  updateHallBooking,
  type CreateHallBookingPayload,
} from "@/lib/api/hallBookings";
import { listFlats } from "@/lib/api/flats";
import type { BackendFlat, BackendHallBooking } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

interface HallBookingFormProps {
  /** Present when editing. Status transitions (approve/reject/cancel)
   *  aren't part of this form — see the list page's action buttons. */
  initial?: BackendHallBooking;
  submitLabel: string;
  onSaved: (booking: BackendHallBooking) => void;
}

/** ISO datetime -> value a `datetime-local` input accepts (local time,
 *  no timezone/seconds). */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HallBookingForm({ initial, submitLabel, onSaved }: HallBookingFormProps) {
  const isEditing = !!initial;

  const [flatId, setFlatId] = useState(initial?.flat_id ? String(initial.flat_id) : "");
  const [hallName, setHallName] = useState(initial?.hall_name ?? "");
  const [startDateTime, setStartDateTime] = useState(
    initial ? toLocalInputValue(initial.start_datetime) : ""
  );
  const [endDateTime, setEndDateTime] = useState(initial ? toLocalInputValue(initial.end_datetime) : "");
  const [purpose, setPurpose] = useState(initial?.purpose ?? "");
  const [amount, setAmount] = useState(String(initial?.amount ?? 0));
  const [deposit, setDeposit] = useState(String(initial?.deposit ?? 0));

  const [flats, setFlats] = useState<BackendFlat[] | null>(null);
  const [flatsError, setFlatsError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listFlats({ limit: 100 })
      .then((res) => setFlats(res.data))
      .catch((err) =>
        setFlatsError(
          err instanceof ApiError || err instanceof ApiNetworkError
            ? err.message
            : "Couldn't load flats for this form."
        )
      );
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isEditing && !flatId) {
      setError("Choose which flat this booking is for.");
      return;
    }
    if (!hallName.trim() || !startDateTime || !endDateTime) {
      setError("Hall, start time and end time are all required.");
      return;
    }
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    if (end <= start) {
      setError("End time must be after start time.");
      return;
    }

    setSubmitting(true);
    try {
      let saved: BackendHallBooking;
      if (isEditing && initial) {
        saved = await updateHallBooking(initial.id, {
          hallName: hallName.trim(),
          startDateTime: start.toISOString(),
          endDateTime: end.toISOString(),
          purpose: purpose || null,
          amount: Number(amount) || 0,
          deposit: Number(deposit) || 0,
        });
      } else {
        const payload: CreateHallBookingPayload = {
          flatId: Number(flatId),
          hallName: hallName.trim(),
          startDateTime: start.toISOString(),
          endDateTime: end.toISOString(),
          purpose: purpose || null,
          amount: Number(amount) || 0,
          deposit: Number(deposit) || 0,
        };
        saved = await createHallBooking(payload);
      }
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't save this booking. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {!isEditing && (
        <Select
          id="booking-flat"
          label="Flat"
          required
          value={flatId}
          onChange={(e) => setFlatId(e.target.value)}
          disabled={!flats}
        >
          <option value="" disabled>
            {flats ? "Select a flat" : "Loading flats…"}
          </option>
          {flats?.map((flat) => (
            <option key={flat.id} value={flat.id}>
              {flat.block} · {flat.unit_no}
            </option>
          ))}
        </Select>
      )}
      {flatsError && <p className="-mt-3 text-xs text-rust">{flatsError}</p>}

      <Input
        id="booking-hall"
        label="Hall name"
        required
        value={hallName}
        onChange={(e) => setHallName(e.target.value)}
        placeholder="e.g. Community Hall"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          id="booking-start"
          label="Start"
          type="datetime-local"
          required
          value={startDateTime}
          onChange={(e) => setStartDateTime(e.target.value)}
        />
        <Input
          id="booking-end"
          label="End"
          type="datetime-local"
          required
          value={endDateTime}
          onChange={(e) => setEndDateTime(e.target.value)}
        />
      </div>

      <Textarea
        id="booking-purpose"
        label="Purpose (optional)"
        rows={2}
        value={purpose ?? ""}
        onChange={(e) => setPurpose(e.target.value)}
        placeholder="e.g. Birthday party"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input id="booking-amount" label="Amount (₹)" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input id="booking-deposit" label="Deposit (₹)" type="number" min="0" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
      </div>

      {error && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <div>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
