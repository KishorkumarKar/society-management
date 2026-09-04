"use client";

import { useState, type FormEvent } from "react";
import {
  createEventCollection,
  updateEventCollection,
  type CreateEventCollectionPayload,
} from "@/lib/api/eventCollections";
import type { BackendEventCollection } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const STATUS_OPTIONS = ["pending", "partial", "paid"] as const;

interface CollectionFormProps {
  eventId: number;
  initial?: BackendEventCollection;
  submitLabel: string;
  onSaved: (collection: BackendEventCollection) => void;
}

/** memberName/unit are free text on the backend (not a foreign key to
 *  users/flats) — this records a contribution from anyone, resident or
 *  not, toward a specific event. */
export default function CollectionForm({ eventId, initial, submitLabel, onSaved }: CollectionFormProps) {
  const isEditing = !!initial;

  const [memberName, setMemberName] = useState(initial?.member_name ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [amountDue, setAmountDue] = useState(String(initial?.amount_due ?? ""));
  const [amountPaid, setAmountPaid] = useState(String(initial?.amount_paid ?? "0"));
  const [paymentDate, setPaymentDate] = useState(
    initial?.payment_date ? initial.payment_date.slice(0, 10) : ""
  );
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number] | "">(initial?.status ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!memberName.trim() || !unit.trim()) {
      setError("Member name and unit are both required.");
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

    setSubmitting(true);
    try {
      let saved: BackendEventCollection;
      if (isEditing && initial) {
        saved = await updateEventCollection(initial.id, {
          memberName: memberName.trim(),
          unit: unit.trim(),
          amountDue: due,
          amountPaid: paid,
          paymentDate: paymentDate || null,
          ...(status ? { status } : {}),
          notes: notes || null,
        });
      } else {
        const payload: CreateEventCollectionPayload = {
          eventId,
          memberName: memberName.trim(),
          unit: unit.trim(),
          amountDue: due,
          amountPaid: paid,
          paymentDate: paymentDate || null,
          ...(status ? { status } : {}),
          notes: notes || null,
        };
        saved = await createEventCollection(payload);
      }
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't save this collection entry. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
          value={status}
          onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])}
        >
          <option value="">Auto (from amounts)</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </Select>
      </div>

      <Input
        id="collection-date"
        label="Payment date (optional)"
        type="date"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
      />

      <Textarea
        id="collection-notes"
        label="Notes"
        rows={3}
        value={notes ?? ""}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional — payment mode, reminders sent, etc."
      />

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
