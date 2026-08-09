"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getAllCollections,
  getCollectionsBySociety,
  getCollectionsByEvent,
  addCollection,
  updateCollection,
  deleteCollection,
  getAllEvents,
  getEventsBySociety,
  getAllUsers,
} from "@/lib/data";
import type { EventCollection, CollectionStatus, PaymentMethod } from "@/lib/types";
import { Wallet, Pencil, Trash2, Plus, X, CheckCircle2, Clock, Ban } from "lucide-react";

function CollectionsContent() {
  const { admin } = useAuth();
  const isSuperAdmin = admin?.role === "super_admin";
  const searchParams = useSearchParams();
  const preselectedEvent = searchParams.get("eventId");

  const allEvents = isSuperAdmin ? getAllEvents() : getEventsBySociety(admin?.societyId || "");
  const [selectedEventId, setSelectedEventId] = useState(preselectedEvent || "all");
  const [collections, setCollections] = useState<EventCollection[]>(
    isSuperAdmin ? getAllCollections() : getCollectionsBySociety(admin?.societyId || "")
  );
  const [modal, setModal] = useState<"add" | { edit: EventCollection } | null>(null);

  function refreshCollections() {
    let data = isSuperAdmin ? getAllCollections() : getCollectionsBySociety(admin?.societyId || "");
    if (selectedEventId !== "all") {
      data = data.filter((c) => c.eventId === selectedEventId);
    }
    setCollections(data);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this collection record?")) return;
    deleteCollection(id);
    refreshCollections();
  }

  // Filter when dropdown changes
  const filteredCollections = selectedEventId === "all"
    ? collections
    : collections.filter((c) => c.eventId === selectedEventId);

  const totalCollected = filteredCollections.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const totalPending = filteredCollections.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl italic text-ink">Event Collections</h1>
          <p className="text-sm text-muted mt-0.5">Track contributions from residents for society events</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              refreshCollections();
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-paper-dim p-4">
          <p className="text-[10px] uppercase tracking-wide text-muted">Total Collected</p>
          <p className="text-xl font-semibold text-sage">₹{totalCollected.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-paper-dim p-4">
          <p className="text-[10px] uppercase tracking-wide text-muted">Pending</p>
          <p className="text-xl font-semibold text-brass">₹{totalPending.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-paper-dim p-4">
          <p className="text-[10px] uppercase tracking-wide text-muted">Records</p>
          <p className="text-xl font-semibold text-ink">{filteredCollections.length}</p>
        </div>
      </div>

      <div className="bg-white border border-paper-dim overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium text-ink">Resident</th>
              <th className="px-4 py-3 font-medium text-ink">Event</th>
              <th className="px-4 py-3 font-medium text-ink">Amount</th>
              <th className="px-4 py-3 font-medium text-ink">Method</th>
              <th className="px-4 py-3 font-medium text-ink">Status</th>
              <th className="px-4 py-3 font-medium text-ink text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-dim">
            {filteredCollections.map((c) => {
              const event = allEvents.find((e) => e.id === c.eventId);
              return (
                <tr key={c.id} className="hover:bg-paper/50">
                  <td className="px-4 py-3 font-medium text-ink">{c.userName}</td>
                  <td className="px-4 py-3 text-ink/80 text-xs">{event?.name || c.eventId}</td>
                  <td className="px-4 py-3 text-ink font-mono">₹{c.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-ink/80 uppercase text-xs">{c.method}</td>
                  <td className="px-4 py-3">
                    <CollectionStatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => setModal({ edit: c })} className="inline-flex items-center gap-1 text-xs text-brass hover:text-brass-dark underline">
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="inline-flex items-center gap-1 text-xs text-rust hover:text-rust underline">
                      <Trash2 size={12} /> Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredCollections.length === 0 && (
          <p className="text-sm text-muted text-center py-8">No collection records found.</p>
        )}
      </div>

      {modal && (
        <CollectionModal
          collection={typeof modal === "object" ? modal.edit : undefined}
          events={allEvents}
          users={getAllUsers()}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            refreshCollections();
          }}
        />
      )}
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <CollectionsContent />
    </Suspense>
  );
}

function CollectionStatusBadge({ status }: { status: CollectionStatus }) {
  const map: Record<CollectionStatus, { class: string; icon: React.ReactNode }> = {
    paid: { class: "bg-sage/10 text-sage", icon: <CheckCircle2 size={10} className="inline mr-1" /> },
    pending: { class: "bg-brass/10 text-brass", icon: <Clock size={10} className="inline mr-1" /> },
    waived: { class: "bg-muted/10 text-muted", icon: <Ban size={10} className="inline mr-1" /> },
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded inline-flex items-center ${map[status].class}`}>
      {map[status].icon}
      {status}
    </span>
  );
}

function CollectionModal({
  collection,
  events,
  users,
  onClose,
  onSaved,
}: {
  collection?: EventCollection;
  events: ReturnType<typeof getAllEvents>;
  users: ReturnType<typeof getAllUsers>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!collection;
  const [form, setForm] = useState({
    eventId: collection?.eventId || events[0]?.id || "",
    userId: collection?.userId || users[0]?.id || "",
    amount: String(collection?.amount || ""),
    method: (collection?.method as PaymentMethod) || "upi",
    status: (collection?.status as CollectionStatus) || "pending",
    paidAt: collection?.paidAt || "",
  });
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const user = users.find((u) => u.id === form.userId);
    const payload = {
      eventId: form.eventId,
      userId: form.userId,
      userName: user?.name || "Unknown",
      amount: Number(form.amount),
      method: form.method as PaymentMethod,
      status: form.status as CollectionStatus,
      paidAt: form.status === "paid" ? (form.paidAt || new Date().toISOString().split("T")[0]) : "",
    };
    if (isEdit) {
      updateCollection(collection.id, payload);
    } else {
      addCollection(payload);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="bg-white w-full max-w-md border border-paper-dim p-6 shadow-pin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl italic text-ink">{isEdit ? "Edit Collection" : "Add Collection"}</h2>
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
            <label className="text-xs uppercase tracking-wide text-muted">Resident</label>
            <select value={form.userId} onChange={(e) => update("userId", e.target.value)} className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none">
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.unit})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Amount (₹)</label>
            <input type="number" required value={form.amount} onChange={(e) => update("amount", e.target.value)} className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Method</label>
              <select value={form.method} onChange={(e) => update("method", e.target.value)} className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Status</label>
              <select value={form.status} onChange={(e) => update("status", e.target.value)} className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none">
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="waived">Waived</option>
              </select>
            </div>
          </div>
          {form.status === "paid" && (
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Paid Date</label>
              <input type="date" value={form.paidAt} onChange={(e) => update("paidAt", e.target.value)} className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none" />
            </div>
          )}
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