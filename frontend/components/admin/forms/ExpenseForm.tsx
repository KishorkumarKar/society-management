"use client";

import { useState, type FormEvent } from "react";
import {
  createEventExpense,
  updateEventExpense,
  type CreateEventExpensePayload,
} from "@/lib/api/eventExpenses";
import type { BackendEventExpense } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const CATEGORIES = ["Decor", "Catering", "Prizes", "Logistics", "Entertainment", "Miscellaneous"];

interface ExpenseFormProps {
  /** Per-event spend (backend `/event-expenses`) — distinct from general
   *  society expenditure, see SocietyExpenseForm for that. */
  eventId: number;
  initial?: BackendEventExpense;
  submitLabel: string;
  onSaved: (expense: BackendEventExpense) => void;
}

export default function ExpenseForm({ eventId, initial, submitLabel, onSaved }: ExpenseFormProps) {
  const isEditing = !!initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [amount, setAmount] = useState(String(initial?.amount ?? ""));
  const [date, setDate] = useState(initial?.expense_date ? initial.expense_date.slice(0, 10) : "");
  const [paidTo, setPaidTo] = useState(initial?.paid_to ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Expense title is required.");
      return;
    }
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt < 0) {
      setError("Amount must be zero or more.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }

    setSubmitting(true);
    try {
      let saved: BackendEventExpense;
      if (isEditing && initial) {
        saved = await updateEventExpense(initial.id, {
          title: title.trim(),
          category,
          amount: amt,
          date,
          paidTo: paidTo || null,
          notes: notes || null,
        });
      } else {
        const payload: CreateEventExpensePayload = {
          eventId,
          title: title.trim(),
          category,
          amount: amt,
          date,
          paidTo: paidTo || null,
          notes: notes || null,
        };
        saved = await createEventExpense(payload);
      }
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't save this expense. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="expense-title"
        label="Expense title"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Decoration & lighting"
      />

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

      <Input id="expense-paidto" label="Paid to" value={paidTo ?? ""} onChange={(e) => setPaidTo(e.target.value)} placeholder="Vendor or person" />

      <Textarea
        id="expense-notes"
        label="Notes"
        rows={3}
        value={notes ?? ""}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional details"
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
