"use client";

import { useState, type FormEvent } from "react";
import {
  createExpense,
  updateExpense,
  type CreateExpensePayload,
} from "@/lib/api/expenses";
import type { BackendExpense } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

interface SocietyExpenseFormProps {
  /** Present when editing. This is general society expenditure
   *  (backend `/expenses`) — distinct from per-event spend, which has its
   *  own separate form/table (see components/admin/forms/ExpenseForm.tsx,
   *  still mock-data for now). */
  initial?: BackendExpense;
  submitLabel: string;
  onSaved: (expense: BackendExpense) => void;
}

export default function SocietyExpenseForm({ initial, submitLabel, onSaved }: SocietyExpenseFormProps) {
  const isEditing = !!initial;

  const [category, setCategory] = useState(initial?.category ?? "");
  const [vendorName, setVendorName] = useState(initial?.vendor_name ?? "");
  const [amount, setAmount] = useState(String(initial?.amount ?? ""));
  const [expenseDate, setExpenseDate] = useState(
    initial?.expense_date ? initial.expense_date.slice(0, 10) : ""
  );
  const [receiptUrl, setReceiptUrl] = useState(initial?.receipt_url ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!category.trim()) {
      setError("Category is required.");
      return;
    }
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    if (!expenseDate) {
      setError("Expense date is required.");
      return;
    }
    if (receiptUrl.trim() && !/^https?:\/\//i.test(receiptUrl.trim())) {
      setError("Receipt URL must be a full http(s) link.");
      return;
    }

    const payload: CreateExpensePayload = {
      category: category.trim(),
      vendorName: vendorName.trim() || null,
      amount: amountNum,
      expenseDate,
      receiptUrl: receiptUrl.trim() || null,
      description: description.trim() || null,
    };

    setSubmitting(true);
    try {
      const saved = isEditing && initial ? await updateExpense(initial.id, payload) : await createExpense(payload);
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          id="expense-category"
          label="Category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Housekeeping, Repairs, Utilities"
        />
        <Input
          id="expense-vendor"
          label="Vendor (optional)"
          value={vendorName ?? ""}
          onChange={(e) => setVendorName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          id="expense-amount"
          label="Amount (₹)"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input
          id="expense-date"
          label="Expense date"
          type="date"
          required
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
        />
      </div>

      <Input
        id="expense-receipt"
        label="Receipt URL (optional)"
        value={receiptUrl ?? ""}
        onChange={(e) => setReceiptUrl(e.target.value)}
        placeholder="https://…"
      />

      <Textarea
        id="expense-description"
        label="Description (optional)"
        rows={3}
        value={description ?? ""}
        onChange={(e) => setDescription(e.target.value)}
      />

      {isEditing && (
        <p className="-mt-1 text-xs text-ink/40">
          Approving or rejecting this expense is done from the list page, not here.
        </p>
      )}

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
