"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getAllExpenses,
  getExpensesBySociety,
  getExpensesByEvent,
  addExpense,
  updateExpense,
  deleteExpense,
  getAllEvents,
  getEventsBySociety,
} from "@/lib/data";
import type { EventExpense } from "@/lib/types";
import { Receipt, Pencil, Trash2, Plus, X } from "lucide-react";

function ExpensesContent() {
  const { admin } = useAuth();
  const isSuperAdmin = admin?.role === "super_admin";
  const searchParams = useSearchParams();
  const preselectedEvent = searchParams.get("eventId");

  const allEvents = isSuperAdmin ? getAllEvents() : getEventsBySociety(admin?.societyId || "");
  const [selectedEventId, setSelectedEventId] = useState(preselectedEvent || "all");
  const [expenses, setExpenses] = useState<EventExpense[]>(
    isSuperAdmin ? getAllExpenses() : getExpensesBySociety(admin?.societyId || "")
  );
  const [modal, setModal] = useState<"add" | { edit: EventExpense } | null>(null);

  function refreshExpenses() {
    let data = isSuperAdmin ? getAllExpenses() : getExpensesBySociety(admin?.societyId || "");
    if (selectedEventId !== "all") {
      data = data.filter((ex) => ex.eventId === selectedEventId);
    }
    setExpenses(data);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this expense record?")) return;
    deleteExpense(id);
    refreshExpenses();
  }

  const filteredExpenses = selectedEventId === "all"
    ? expenses
    : expenses.filter((ex) => ex.eventId === selectedEventId);

  const totalSpent = filteredExpenses.reduce((s, ex) => s + ex.amount, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl italic text-ink">Event Expenses</h1>
          <p className="text-sm text-muted mt-0.5">Track all spending for society events</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              refreshExpenses();
            }}
            className="border border-paper-dim bg-white px-3 py-2 text-sm text-ink focus:border-brass outline-none"
          >
            <option value="all">All Events</option>
            {allEvents.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <button
            onClick={() => setModal("add")}
            className="flex items-center gap-2 bg-brass text-ink text-sm font-semibold uppercase tracking-wide px-4 py-2.5 hover:bg-brass-light transition-colors"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-paper-dim p-4">
          <p className="text-[10px] uppercase tracking-wide text-muted">Total Spent</p>
          <p className="text-xl font-semibold text-rust">₹{totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-paper-dim p-4">
          <p className="text-[10px] uppercase tracking-wide text-muted">Expense Entries</p>
          <p className="text-xl font-semibold text-ink">{filteredExpenses.length}</p>
        </div>
      </div>

      <div className="bg-white border border-paper-dim overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium text-ink">Description</th>
              <th className="px-4 py-3 font-medium text-ink">Event</th>
              <th className="px-4 py-3 font-medium text-ink">Vendor</th>
              <th className="px-4 py-3 font-medium text-ink">Category</th>
              <th className="px-4 py-3 font-medium text-ink">Amount</th>
              <th className="px-4 py-3 font-medium text-ink">Date</th>
              <th className="px-4 py-3 font-medium text-ink text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-dim">
            {filteredExpenses.map((ex) => {
              const event = allEvents.find((e) => e.id === ex.eventId);
              return (
                <tr key={ex.id} className="hover:bg-paper/50">
                  <td className="px-4 py-3 font-medium text-ink">{ex.description}</td>
                  <td className="px-4 py-3 text-ink/80 text-xs">{event?.name || ex.eventId}</td>
                  <td className="px-4 py-3 text-ink/80">{ex.vendor}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 bg-ink/5 text-ink rounded">{ex.category}</span>
                  </td>
                  <td className="px-4 py-3 text-ink font-mono">₹{ex.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-ink/80 text-xs">{ex.spentAt}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setModal({ edit: ex })} className="inline-flex items-center gap-1 text-xs text-brass hover:text-brass-dark underline">
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => handleDelete(ex.id)} className="inline-flex items-center gap-1 text-xs text-rust hover:text-rust underline">
                      <Trash2 size={12} /> Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredExpenses.length === 0 && (
          <p className="text-sm text-muted text-center py-8">No expense records found.</p>
        )}
      </div>

      {modal && (
        <ExpenseModal
          expense={typeof modal === "object" ? modal.edit : undefined}
          events={allEvents}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            refreshExpenses();
          }}
        />
      )}
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <ExpensesContent />
    </Suspense>
  );
}

function ExpenseModal({
  expense,
  events,
  onClose,
  onSaved,
}: {
  expense?: EventExpense;
  events: ReturnType<typeof getAllEvents>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!expense;
  const [form, setForm] = useState({
    eventId: expense?.eventId || events[0]?.id || "",
    description: expense?.description || "",
    vendor: expense?.vendor || "",
    amount: String(expense?.amount || ""),
    category: expense?.category || "General",
    spentAt: expense?.spentAt || new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      eventId: form.eventId,
      description: form.description,
      vendor: form.vendor,
      amount: Number(form.amount),
      category: form.category,
      spentAt: form.spentAt,
    };
    if (isEdit) {
      updateExpense(expense.id, payload);
    } else {
      addExpense(payload);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="bg-white w-full max-w-md border border-paper-dim p-6 shadow-pin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl italic text-ink">{isEdit ? "Edit Expense" : "Add Expense"}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Event</label>
            <select value={form.eventId} onChange={(e) => update("eventId", e.target.value)} className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none">
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Description</label>
            <input required value={form.description} onChange={(e) => update("description", e.target.value)} className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Vendor</label>
            <input required value={form.vendor} onChange={(e) => update("vendor", e.target.value)} className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Amount (₹)</label>
              <input type="number" required value={form.amount} onChange={(e) => update("amount", e.target.value)} className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Category</label>
              <select value={form.category} onChange={(e) => update("category", e.target.value)} className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none">
                <option value="General">General</option>
                <option value="Decor">Decor</option>
                <option value="Food">Food</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Permits">Permits</option>
                <option value="Logistics">Logistics</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Spent Date</label>
            <input type="date" required value={form.spentAt} onChange={(e) => update("spentAt", e.target.value)} className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-paper-dim px-4 py-2 text-sm text-ink hover:border-ink transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-brass text-ink font-semibold text-sm uppercase tracking-wide px-4 py-2 hover:bg-brass-light transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}