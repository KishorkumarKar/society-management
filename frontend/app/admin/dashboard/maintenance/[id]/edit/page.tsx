"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getMaintenanceBill,
  deleteMaintenanceBill,
  listMaintenancePayments,
  recordMaintenancePayment,
  type RecordPaymentPayload,
} from "@/lib/api/maintenance";
import type { BackendMaintenanceBill, BackendMaintenancePayment } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import MaintenanceBillForm from "@/components/admin/forms/MaintenanceBillForm";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const PAYMENT_METHODS = ["cash", "cheque", "upi", "bank_transfer", "card", "other"] as const;

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError || err instanceof ApiNetworkError ? err.message : fallback;
}

function money(value: string | number): string {
  const n = Number(value);
  return Number.isFinite(n) ? `₹${n.toLocaleString("en-IN")}` : "—";
}

function EditMaintenanceBillContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? Number(params.id) : NaN;
  const router = useRouter();

  const [bill, setBill] = useState<BackendMaintenanceBill | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [payments, setPayments] = useState<BackendMaintenancePayment[] | null>(null);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof PAYMENT_METHODS)[number]>("cash");
  const [transactionId, setTransactionId] = useState("");
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  function refreshBill() {
    if (!Number.isFinite(id)) return;
    getMaintenanceBill(id)
      .then(setBill)
      .catch((err) => setLoadError(errorMessage(err, "This bill may have already been removed.")));
  }

  function refreshPayments() {
    if (!Number.isFinite(id)) return;
    listMaintenancePayments(id)
      .then(setPayments)
      .catch((err) => setPaymentsError(errorMessage(err, "Couldn't load payments for this bill.")));
  }

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid bill id.");
      return;
    }
    refreshBill();
    refreshPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDelete() {
    try {
      await deleteMaintenanceBill(id);
      router.push("/admin/dashboard/maintenance");
    } catch (err) {
      setActionError(errorMessage(err, "Couldn't delete this bill."));
    }
  }

  async function handleRecordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecordError(null);

    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      setRecordError("Amount must be greater than zero.");
      return;
    }
    if (!paymentDate) {
      setRecordError("Payment date is required.");
      return;
    }

    const payload: RecordPaymentPayload = {
      amount: amountNum,
      paymentDate,
      paymentMethod,
      transactionId: transactionId || null,
    };

    setRecording(true);
    try {
      await recordMaintenancePayment(id, payload);
      setAmount("");
      setTransactionId("");
      refreshPayments();
      refreshBill();
    } catch (err) {
      setRecordError(errorMessage(err, "Couldn't record this payment."));
    } finally {
      setRecording(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Bill not found" description={loadError} />
        <Button
          href="/admin/dashboard/maintenance"
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to maintenance
        </Button>
      </div>
    );
  }

  if (!bill) {
    return <div className="py-16 text-center text-ink/40">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Edit bill · ${String(bill.billing_month).padStart(2, "0")}/${bill.billing_year}`}
        description="Update the bill, or record a payment against it below."
        action={
          <ConfirmDeleteButton
            label={`the ${bill.billing_month}/${bill.billing_year} bill`}
            onConfirm={handleDelete}
          />
        }
      />
      {actionError && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {actionError}
        </p>
      )}

      <Card className="max-w-2xl p-8">
        <MaintenanceBillForm initial={bill} submitLabel="Save changes" onSaved={setBill} />
      </Card>

      <Card className="flex max-w-2xl flex-col gap-5 p-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Payments</h2>
            <span className="text-sm text-ink/50">
              {money(bill.totalPaid)} paid ·{" "}
              {bill.outstanding > 0 ? `${money(bill.outstanding)} outstanding` : "settled"}
            </span>
          </div>
          <p className="text-sm text-ink/50">
            Recording a payment here doesn&apos;t change the bill&apos;s status label above —
            that&apos;s set independently.
          </p>
        </div>

        {paymentsError && <p className="text-sm text-rust">{paymentsError}</p>}
        {!payments && !paymentsError && <p className="text-sm text-ink/40">Loading payments…</p>}
        {payments && payments.length === 0 && (
          <p className="text-sm text-ink/40">No payments recorded yet.</p>
        )}
        {payments && payments.length > 0 && (
          <div className="flex flex-col divide-y divide-ink/10 border-y border-ink/10">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-ink">{money(payment.amount)}</span>
                  <span className="text-xs text-ink/40">
                    {payment.payment_date} · {payment.payment_method.replace(/_/g, " ")}
                    {payment.transaction_id ? ` · ${payment.transaction_id}` : ""}
                  </span>
                </div>
                <Badge tone={payment.status === "success" ? "sage" : "muted"}>{payment.status}</Badge>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleRecordPayment} className="flex flex-col gap-4 border-t border-ink/10 pt-4">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
            Record a payment
          </span>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="payment-amount"
              label="Amount (₹)"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              id="payment-date"
              label="Payment date"
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              id="payment-method"
              label="Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as (typeof PAYMENT_METHODS)[number])}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
            <Input
              id="payment-transaction"
              label="Transaction ID (optional)"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>
          {recordError && <p className="text-sm text-rust">{recordError}</p>}
          <div>
            <Button type="submit" variant="primary" disabled={recording}>
              {recording ? "Recording…" : "Record payment"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function EditMaintenanceBillPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <EditMaintenanceBillContent />
    </RequireRole>
  );
}
