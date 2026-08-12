"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import type { EventExpense } from "@/lib/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const CATEGORIES = ["Decor", "Catering", "Prizes", "Logistics", "Entertainment", "Miscellaneous"];

interface ExpenseFormProps {
  initial?: EventExpense;
  /** Pass this when adding/editing from within a single event's workspace —
   *  the event picker is hidden and this id is used instead. */
  fixedEventId?: string;
  submitLabel: string;
  onSubmit: (input: Omit<EventExpense, "id">) => void;
}

export default function ExpenseForm({
  initial,
  fixedEventId,
  submitLabel,
  onSubmit,
}: ExpenseFormProps) {
  const { user: currentUser } = useAuth();
  const { events } = useData();
  const isSuperAdmin = currentUser?.role === "super-admin";

  const availableEvents = isSuperAdmin
    ? events
    : events.filter((event) => event.societyId === currentUser?.societyId);

  const [eventId, setEventId] = useState(initial?.eventId ?? fixedEventId ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [paidTo, setPaidTo] = useState(initial?.paidTo ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const finalEventId = fixedEventId ?? eventId;
    const targetEvent = events.find((e) => e.id === finalEventId);
    if (!targetEvent) {
      setError("Choose an event for this expense.");
      return;
    }
    if (!title.trim()) {
      setError("Expense title is required.");
      return;
    }
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt < 0) {
      setError("Amount must be zero or more.");
      return;
    }

    onSubmit({
      eventId: finalEventId,
      societyId: targetEvent.societyId,
      title,
      category,
      amount: amt,
      date,
      paidTo,
      notes,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {!fixedEventId && (
        <Select
          id="expense-event"
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

      <Input id="expense-title" label="Expense title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Decoration & lighting" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Select id="expense-category" label="Category" required value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Input
          id="expense-amount"
          label="Amount (₹)"
          type="number"
          min="0"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input id="expense-date" label="Date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <Input id="expense-paidto" label="Paid to" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} placeholder="Vendor or person" />

      <Textarea
        id="expense-notes"
        label="Notes"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional details"
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
