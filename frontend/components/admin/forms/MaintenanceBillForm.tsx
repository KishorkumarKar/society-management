"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  createMaintenanceBill,
  updateMaintenanceBill,
  type CreateMaintenanceBillPayload,
} from "@/lib/api/maintenance";
import { listFlats } from "@/lib/api/flats";
import type { BackendFlat, BackendMaintenanceBill } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const STATUS_OPTIONS = ["due", "paid", "overdue", "approved"] as const;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MaintenanceBillFormProps {
  /** Present when editing. flatId/billingYear/billingMonth are immutable
   *  once a bill exists (no such fields in updateBillSchema), so those
   *  three fields are shown read-only rather than editable. */
  initial?: BackendMaintenanceBill;
  submitLabel: string;
  onSaved: (bill: BackendMaintenanceBill) => void;
}

export default function MaintenanceBillForm({ initial, submitLabel, onSaved }: MaintenanceBillFormProps) {
  const isEditing = !!initial;
  const now = new Date();

  const [flatId, setFlatId] = useState(initial?.flat_id ? String(initial.flat_id) : "");
  const [billingYear, setBillingYear] = useState(String(initial?.billing_year ?? now.getFullYear()));
  const [billingMonth, setBillingMonth] = useState(String(initial?.billing_month ?? now.getMonth() + 1));
  const [amount, setAmount] = useState(String(initial?.amount ?? ""));
  const [dueDate, setDueDate] = useState(initial?.due_date ? initial.due_date.slice(0, 10) : "");
  const [penalty, setPenalty] = useState(String(initial?.penalty ?? 0));
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>(initial?.status ?? "due");

  const [flats, setFlats] = useState<BackendFlat[] | null>(null);
  const [flatsError, setFlatsError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing) return;
    listFlats({ limit: 100 })
      .then((res) => setFlats(res.data))
      .catch((err) =>
        setFlatsError(
          err instanceof ApiError || err instanceof ApiNetworkError
            ? err.message
            : "Couldn't load flats for this form."
        )
      );
  }, [isEditing]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    if (!dueDate) {
      setError("Due date is required.");
      return;
    }

    setSubmitting(true);
    try {
      let saved: BackendMaintenanceBill;
      if (isEditing && initial) {
        saved = await updateMaintenanceBill(initial.id, {
          amount: amountNum,
          dueDate,
          status,
          penalty: Number(penalty) || 0,
        });
      } else {
        if (!flatId) {
          setError("Choose which flat this bill is for.");
          setSubmitting(false);
          return;
        }
        const payload: CreateMaintenanceBillPayload = {
          flatId: Number(flatId),
          billingYear: Number(billingYear),
          billingMonth: Number(billingMonth),
          amount: amountNum,
          dueDate,
          penalty: Number(penalty) || 0,
        };
        saved = await createMaintenanceBill(payload);
      }
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't save this bill. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {isEditing && initial ? (
        <p className="text-xs text-ink/40">
          Flat, billing year and billing month can&apos;t be changed once a bill exists — delete
          and recreate it instead if those were wrong.
        </p>
      ) : (
        <Select id="bill-flat" label="Flat" required value={flatId} onChange={(e) => setFlatId(e.target.value)} disabled={!flats}>
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

      {!isEditing && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Select id="bill-year" label="Billing year" value={billingYear} onChange={(e) => setBillingYear(e.target.value)}>
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <Select id="bill-month" label="Billing month" value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input id="bill-amount" label="Amount (₹)" type="number" min="0.01" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input id="bill-due-date" label="Due date" type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input id="bill-penalty" label="Penalty (₹, optional)" type="number" min="0" step="0.01" value={penalty} onChange={(e) => setPenalty(e.target.value)} />
        {isEditing && (
          <Select id="bill-status" label="Status" value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        )}
      </div>
      {isEditing && (
        <p className="-mt-3 text-xs text-ink/40">
          Status is a label you set directly here — it doesn&apos;t change automatically when a
          payment is recorded below. The outstanding balance shown on the list is always computed
          from actual payments, independent of this field.
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
