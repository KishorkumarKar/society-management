"use client";

import { useState, type FormEvent } from "react";
import { createEvent, updateEvent, type CreateEventPayload } from "@/lib/api/events";
import type { BackendEvent } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const STATUS_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

interface EventFormProps {
  /** Present when editing. Events are always scoped to the caller's own
   *  society server-side — there's no society picker here even for Super
   *  Admin, since `/events` has no cross-society mode. */
  initial?: BackendEvent;
  submitLabel: string;
  onSaved: (event: BackendEvent) => void;
}

export default function EventForm({ initial, submitLabel, onSaved }: EventFormProps) {
  const isEditing = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [eventDate, setEventDate] = useState(initial?.event_date ? initial.event_date.slice(0, 10) : "");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]["value"]>(
    initial?.status ?? "upcoming"
  );
  const [targetAmount, setTargetAmount] = useState(String(initial?.target_amount ?? 0));

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Event name is required.");
      return;
    }
    if (!eventDate) {
      setError("Event date is required.");
      return;
    }
    const target = Number(targetAmount);
    if (Number.isNaN(target) || target < 0) {
      setError("Target amount must be zero or more.");
      return;
    }

    const payload: CreateEventPayload = {
      name,
      description: description || null,
      eventDate,
      status,
      targetAmount: target,
    };

    setSubmitting(true);
    try {
      const saved = isEditing && initial ? await updateEvent(initial.id, payload) : await createEvent(payload);
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't save this event. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="event-name"
        label="Event name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Halloween Bash"
      />

      <Textarea
        id="event-description"
        label="Description"
        rows={3}
        value={description ?? ""}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What's this event about?"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Input
          id="event-date"
          label="Date"
          type="date"
          required
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />
        <Select
          id="event-status"
          label="Status"
          required
          value={status}
          onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number]["value"])}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input
          id="event-target"
          label="Target amount (₹)"
          type="number"
          min="0"
          required
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
        />
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
