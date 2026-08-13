"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import type { EventCollection, CollectionStatus } from "@/lib/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const STATUS_OPTIONS: { value: CollectionStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
];

interface CollectionFormProps {
  initial?: EventCollection;
  /** Pass this when adding/editing from within a single event's workspace —
   *  the event picker is hidden and this id is used instead. */
  fixedEventId?: string;
  submitLabel: string;
  onSubmit: (input: Omit<EventCollection, "id">) => void;
}

export default function CollectionForm({
  initial,
  fixedEventId,
  submitLabel,
  onSubmit,
}: CollectionFormProps) {
  const { user: currentUser } = useAuth();
  const { events } = useData();
  const isSuperAdmin = currentUser?.role === "super-admin";

  const availableEvents = isSuperAdmin
    ? events
    : events.filter((event) => event.societyId === currentUser?.societyId);

  const [eventId, setEventId] = useState(initial?.eventId ?? fixedEventId ?? "");
  const [memberName, setMemberName] = useState(initial?.memberName ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [amountDue, setAmountDue] = useState(initial?.amountDue?.toString() ?? "");
  const [amountPaid, setAmountPaid] = useState(initial?.amountPaid?.toString() ?? "0");
  const [paymentDate, setPaymentDate] = useState(initial?.paymentDate ?? "");
  const [status, setStatus] = useState<CollectionStatus>(initial?.status ?? "pending");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const finalEventId = fixedEventId ?? eventId;
    const targetEvent = events.find((e) => e.id === finalEventId);
    if (!targetEvent) {
      setError("Choose an event for this collection entry.");
      return;
    }
    if (!memberName.trim()) {
      setError("Member name is required.");
      return;
    }
    const due = Number(amountDue);
    const paid = Number(amountPaid);
    if (Number.isNaN(due) || due < 0) {
      setError("Amount due must be zero or more.");
      return;
    }
    if (Number.isNaN(paid) || paid < 0) {
      setError("Amount paid must be zero or more.");
      return;
    }

    onSubmit({
      eventId: finalEventId,
      societyId: targetEvent.societyId,
      memberName,
      unit,
      amountDue: due,
      amountPaid: paid,
      paymentDate,
      status,
      notes,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {!fixedEventId && (
        <Select
          id="collection-event"
          label="Event"
          required
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        >
          <option value="" disabled>
            Select an event
          </option>
          {availableEvents.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </Select>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          id="collection-member"
          label="Member name"
          required
          value={memberName}
          onChange={(e) => setMemberName(e.target.value)}
        />
        <Input id="collection-unit" label="Unit" required value={unit} onChange={(e) => setUnit(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Input
          id="collection-due"
          label="Amount due (₹)"
          type="number"
          min="0"
          required
          value={amountDue}
          onChange={(e) => setAmountDue(e.target.value)}
        />
        <Input
          id="collection-paid"
          label="Amount paid (₹)"
          type="number"
          min="0"
          required
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
        />
        <Select
          id="collection-status"
          label="Status"
          required
          value={status}
          onChange={(e) => setStatus(e.target.value as CollectionStatus)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <Input
        id="collection-date"
        label="Payment date"
        type="date"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
      />

      <Textarea
        id="collection-notes"
        label="Notes"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional — payment mode, reminders sent, etc."
      />

      {error && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <div>
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
