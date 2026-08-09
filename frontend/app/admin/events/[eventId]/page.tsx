"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getEventById,
  getEventSummary,
  getCollectionsByEvent,
  getExpensesByEvent,
  getAllUsers,
  addCollection,
  updateCollection,
  deleteCollection,
  addExpense,
  updateExpense,
  deleteExpense,
  updateEvent,
  deleteEvent,
  getAllSocieties,
} from "@/lib/data";
import type {
  EventCollection,
  EventExpense,
  EventStatus,
  CollectionStatus,
  PaymentMethod,
} from "@/lib/types";
import {
  ArrowLeft,
  CalendarDays,
  Pencil,
  Trash2,
  Plus,
  X,
  Wallet,
  Receipt,
  Info,
  CheckCircle2,
  Clock,
  Ban,
} from "lucide-react";

type TabKey = "details" | "collections" | "expenses";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { admin } = useAuth();
  const eventId = params.eventId as string;

  const event = getEventById(eventId);
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [refreshKey, setRefreshKey] = useState(0);

  if (!event) {
    return (
      <div className="text-center py-20">
        <h2 className="font-display text-xl italic text-ink">Event Not Found</h2>
        <button
          onClick={() => router.push("/admin/events")}
          className="mt-4 text-sm text-brass underline"
        >
          ← Back to Events
        </button>
      </div>
    );
  }

  const isSuperAdmin = admin?.role === "super_admin";
  const canEdit = isSuperAdmin || event.societyId === admin?.societyId;

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  const summary = getEventSummary(eventId);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "details", label: "Details", icon: <Info size={16} /> },
    { key: "collections", label: "Collections", icon: <Wallet size={16} /> },
    { key: "expenses", label: "Expenses", icon: <Receipt size={16} /> },
  ];

  return (
    <div key={refreshKey}>
      {/* Header */}
      <button
        onClick={() => router.push("/admin/events")}
        className="flex items-center gap-1 text-sm text-muted hover:text-ink mb-4"
      >
        <ArrowLeft size={14} /> Back to Events
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl italic text-ink">{event.name}</h1>
            <StatusBadge status={event.status} />
          </div>
          <p className="text-sm text-muted mt-1">{event.description}</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm("Delete this event? All collections and expenses will also be removed.")) {
                  deleteEvent(eventId);
                  router.push("/admin/events");
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wide text-rust border border-rust/30 hover:bg-rust/10 transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Budget" value={`₹${event.budget.toLocaleString()}`} color="text-ink" />
        <SummaryCard label="Collected" value={`₹${summary?.totalCollected.toLocaleString() || 0}`} color="text-sage" />
        <SummaryCard label="Pending" value={`₹${summary?.totalPending.toLocaleString() || 0}`} color="text-brass" />
        <SummaryCard label="Spent" value={`₹${summary?.totalSpent.toLocaleString() || 0}`} color="text-rust" />
      </div>

      {/* Vertical Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Vertical Tab Buttons */}
        <div className="lg:w-48 shrink-0 space-y-1">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left rounded transition-colors ${
                  active
                    ? "bg-brass/20 text-brass border-l-2 border-brass font-medium"
                    : "text-ink/70 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.key === "collections" && summary && (
                  <span className="ml-auto text-[10px] bg-ink/5 px-1.5 py-0.5 rounded">
                    {summary.collectionCount}
                  </span>
                )}
                {tab.key === "expenses" && summary && (
                  <span className="ml-auto text-[10px] bg-ink/5 px-1.5 py-0.5 rounded">
                    {summary.expenseCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === "details" && (
            <DetailsTab event={event} canEdit={canEdit} onUpdate={refresh} />
          )}
          {activeTab === "collections" && (
            <CollectionsTab eventId={eventId} canEdit={canEdit} onUpdate={refresh} />
          )}
          {activeTab === "expenses" && (
            <ExpensesTab eventId={eventId} canEdit={canEdit} onUpdate={refresh} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub Components ─── */

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white border border-paper-dim p-4">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className={`text-lg font-semibold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: EventStatus }) {
  const map: Record<EventStatus, string> = {
    upcoming: "bg-sage/10 text-sage",
    ongoing: "bg-brass/10 text-brass",
    completed: "bg-ink/10 text-ink",
    cancelled: "bg-rust/10 text-rust",
  };
  return (
    <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${map[status]}`}>
      {status}
    </span>
  );
}

/* ─── Details Tab ─── */

function DetailsTab({
  event,
  canEdit,
  onUpdate,
}: {
  event: NonNullable<ReturnType<typeof getEventById>>;
  canEdit: boolean;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const societies = getAllSocieties();
  const society = societies.find((s) => s.id === event.societyId);

  const [form, setForm] = useState({
    name: event.name,
    description: event.description,
    eventDate: event.eventDate,
    status: event.status,
    budget: String(event.budget),
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function save() {
    updateEvent(event.id, {
      name: form.name,
      description: form.description,
      eventDate: form.eventDate,
      status: form.status as EventStatus,
      budget: Number(form.budget),
    });
    setEditing(false);
    onUpdate();
  }

  return (
    <div className="bg-white border border-paper-dim p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg italic text-ink">Event Details</h2>
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-brass hover:text-brass-dark underline"
          >
            <Pencil size={12} /> Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Event Name</label>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Event Date</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => update("eventDate", e.target.value)}
                className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Status</label>
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Budget (₹)</label>
            <input
              type="number"
              value={form.budget}
              onChange={(e) => update("budget", e.target.value)}
              className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm text-ink border border-paper-dim hover:border-ink transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="px-4 py-2 text-sm bg-brass text-ink font-semibold uppercase tracking-wide hover:bg-brass-light transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted mb-1">Event Date</p>
              <p className="text-sm text-ink flex items-center gap-2">
                <CalendarDays size={14} className="text-brass" />
                {new Date(event.eventDate).toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted mb-1">Society</p>
              <p className="text-sm text-ink">{society?.name || event.societyId}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted mb-1">Budget</p>
              <p className="text-sm text-ink font-mono">₹{event.budget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted mb-1">Created</p>
              <p className="text-sm text-ink">{event.createdAt}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted mb-1">Description</p>
            <p className="text-sm text-ink/80 leading-relaxed">{event.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Collections Tab ─── */

function CollectionsTab({
  eventId,
  canEdit,
  onUpdate,
}: {
  eventId: string;
  canEdit: boolean;
  onUpdate: () => void;
}) {
  const [collections, setCollections] = useState(getCollectionsByEvent(eventId));
  const [modal, setModal] = useState<"add" | { edit: EventCollection } | null>(null);
  const allUsers = getAllUsers();

  function refresh() {
    setCollections(getCollectionsByEvent(eventId));
    onUpdate();
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this collection record?")) return;
    deleteCollection(id);
    refresh();
  }

  const totalCollected = collections.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const totalPending = collections.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg italic text-ink">Collections</h2>
          <p className="text-xs text-muted">
            Collected: <span className="text-sage font-medium">₹{totalCollected.toLocaleString()}</span> · Pending:{" "}
            <span className="text-brass font-medium">₹{totalPending.toLocaleString()}</span>
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setModal("add")}
            className="flex items-center gap-2 bg-brass text-ink text-xs font-semibold uppercase tracking-wide px-4 py-2 hover:bg-brass-light transition-colors"
          >
            <Plus size={14} /> Add Collection
          </button>
        )}
      </div>

      <div className="bg-white border border-paper-dim overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium text-ink">Resident</th>
              <th className="px-4 py-3 font-medium text-ink">Amount</th>
              <th className="px-4 py-3 font-medium text-ink">Method</th>
              <th className="px-4 py-3 font-medium text-ink">Status</th>
              <th className="px-4 py-3 font-medium text-ink">Paid On</th>
              {canEdit && <th className="px-4 py-3 font-medium text-ink text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-dim">
            {collections.map((c) => (
              <tr key={c.id} className="hover:bg-paper/50">
                <td className="px-4 py-3 font-medium text-ink">{c.userName}</td>
                <td className="px-4 py-3 text-ink font-mono">₹{c.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-ink/80 uppercase text-xs">{c.method}</td>
                <td className="px-4 py-3">
                  <CollectionStatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3 text-ink/80 text-xs">{c.paidAt || "—"}</td>
                {canEdit && (
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => setModal({ edit: c })}
                      className="text-xs text-brass hover:text-brass-dark underline"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="text-xs text-rust hover:text-rust underline">
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {collections.length === 0 && (
          <p className="text-sm text-muted text-center py-8">No collections recorded yet.</p>
        )}
      </div>

      {modal && (
        <CollectionModal
          eventId={eventId}
          collection={typeof modal === "object" ? modal.edit : undefined}
          users={allUsers}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            refresh();
          }}
        />
      )}
    </div>
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
  eventId,
  collection,
  users,
  onClose,
  onSaved,
}: {
  eventId: string;
  collection?: EventCollection;
  users: ReturnType<typeof getAllUsers>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!collection;
  const [form, setForm] = useState({
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
      eventId,
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
      <div className="bg-white w-full max-w-sm border border-paper-dim p-6 shadow-pin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg italic text-ink">
            {isEdit ? "Edit Collection" : "Add Collection"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Resident</label>
            <select
              value={form.userId}
              onChange={(e) => update("userId", e.target.value)}
              className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Amount (₹)</label>
            <input
              type="number"
              required
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
              className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Method</label>
              <select
                value={form.method}
                onChange={(e) => update("method", e.target.value)}
                className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Status</label>
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="waived">Waived</option>
              </select>
            </div>
          </div>
          {form.status === "paid" && (
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Paid Date</label>
              <input
                type="date"
                value={form.paidAt}
                onChange={(e) => update("paidAt", e.target.value)}
                className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
              />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-paper-dim px-4 py-2 text-sm text-ink hover:border-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-brass text-ink font-semibold text-sm uppercase tracking-wide px-4 py-2 hover:bg-brass-light transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Expenses Tab ─── */

function ExpensesTab({
  eventId,
  canEdit,
  onUpdate,
}: {
  eventId: string;
  canEdit: boolean;
  onUpdate: () => void;
}) {
  const [expenses, setExpenses] = useState(getExpensesByEvent(eventId));
  const [modal, setModal] = useState<"add" | { edit: EventExpense } | null>(null);

  function refresh() {
    setExpenses(getExpensesByEvent(eventId));
    onUpdate();
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this expense record?")) return;
    deleteExpense(id);
    refresh();
  }

  const totalSpent = expenses.reduce((s, ex) => s + ex.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg italic text-ink">Expenses</h2>
          <p className="text-xs text-muted">
            Total Spent: <span className="text-rust font-medium">₹{totalSpent.toLocaleString()}</span>
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setModal("add")}
            className="flex items-center gap-2 bg-brass text-ink text-xs font-semibold uppercase tracking-wide px-4 py-2 hover:bg-brass-light transition-colors"
          >
            <Plus size={14} /> Add Expense
          </button>
        )}
      </div>

      <div className="bg-white border border-paper-dim overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium text-ink">Description</th>
              <th className="px-4 py-3 font-medium text-ink">Vendor</th>
              <th className="px-4 py-3 font-medium text-ink">Category</th>
              <th className="px-4 py-3 font-medium text-ink">Amount</th>
              <th className="px-4 py-3 font-medium text-ink">Date</th>
              {canEdit && <th className="px-4 py-3 font-medium text-ink text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-dim">
            {expenses.map((ex) => (
              <tr key={ex.id} className="hover:bg-paper/50">
                <td className="px-4 py-3 font-medium text-ink">{ex.description}</td>
                <td className="px-4 py-3 text-ink/80">{ex.vendor}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 bg-ink/5 text-ink rounded">{ex.category}</span>
                </td>
                <td className="px-4 py-3 text-ink font-mono">₹{ex.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-ink/80 text-xs">{ex.spentAt}</td>
                {canEdit && (
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => setModal({ edit: ex })}
                      className="text-xs text-brass hover:text-brass-dark underline"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDelete(ex.id)} className="text-xs text-rust hover:text-rust underline">
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && (
          <p className="text-sm text-muted text-center py-8">No expenses recorded yet.</p>
        )}
      </div>

      {modal && (
        <ExpenseModal
          eventId={eventId}
          expense={typeof modal === "object" ? modal.edit : undefined}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function ExpenseModal({
  eventId,
  expense,
  onClose,
  onSaved,
}: {
  eventId: string;
  expense?: EventExpense;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!expense;
  const [form, setForm] = useState({
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
      eventId,
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
      <div className="bg-white w-full max-w-sm border border-paper-dim p-6 shadow-pin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg italic text-ink">{isEdit ? "Edit Expense" : "Add Expense"}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Description</label>
            <input
              required
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Vendor</label>
            <input
              required
              value={form.vendor}
              onChange={(e) => update("vendor", e.target.value)}
              className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Amount (₹)</label>
              <input
                type="number"
                required
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Category</label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
              >
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
            <input
              type="date"
              required
              value={form.spentAt}
              onChange={(e) => update("spentAt", e.target.value)}
              className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-paper-dim px-4 py-2 text-sm text-ink hover:border-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-brass text-ink font-semibold text-sm uppercase tracking-wide px-4 py-2 hover:bg-brass-light transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}