"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getAllEvents,
  getEventsBySociety,
  addEvent,
  updateEvent,
  deleteEvent,
  getEventSummary,
  getAllSocieties,
} from "@/lib/data";
import type { SocietyEvent, EventStatus } from "@/lib/types";
import {
  CalendarDays,
  Pencil,
  Trash2,
  Plus,
  X,
  Wallet,
  Receipt,
} from "lucide-react";
import Link from "next/link";

export default function EventsPage() {
  const { admin } = useAuth();
  const isSuperAdmin = admin?.role === "super_admin";
  const [events, setEvents] = useState<SocietyEvent[]>(
    isSuperAdmin ? getAllEvents() : getEventsBySociety(admin?.societyId || ""),
  );
  const [modal, setModal] = useState<"add" | { edit: SocietyEvent } | null>(
    null,
  );

  function refreshEvents() {
    setEvents(
      isSuperAdmin
        ? getAllEvents()
        : getEventsBySociety(admin?.societyId || ""),
    );
  }

  function handleDelete(id: string) {
    if (
      !confirm(
        "Delete this event? All collections and expenses will also be removed.",
      )
    )
      return;
    deleteEvent(id);
    refreshEvents();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl italic text-ink">Events</h1>
          <p className="text-sm text-muted mt-0.5">
            Manage society events, collections & expenses
          </p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 bg-brass text-ink text-sm font-semibold uppercase tracking-wide px-4 py-2.5 hover:bg-brass-light transition-colors"
        >
          <Plus size={16} />
          Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {events.map((event) => {
          const summary = getEventSummary(event.id);
          return (
            <div
              key={event.id}
              className="bg-white border border-paper-dim p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg italic text-ink">
                      {event.name}
                    </h3>
                    <StatusBadge status={event.status} />
                  </div>
                  <p className="text-xs text-muted mt-1">{event.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setModal({ edit: event })}
                    className="p-1.5 text-brass hover:bg-brass/10 rounded"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-1.5 text-rust hover:bg-rust/10 rounded"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-paper-dim">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted">
                    Budget
                  </p>
                  <p className="text-sm font-semibold text-ink">
                    ₹{event.budget.toLocaleString()}
                  </p>
                </div>
                <div className="text-center border-l border-paper-dim">
                  <p className="text-[10px] uppercase tracking-wide text-muted">
                    Collected
                  </p>
                  <p className="text-sm font-semibold text-sage">
                    ₹{summary?.totalCollected.toLocaleString() || 0}
                  </p>
                </div>
                <div className="text-center border-l border-paper-dim">
                  <p className="text-[10px] uppercase tracking-wide text-muted">
                    Spent
                  </p>
                  <p className="text-sm font-semibold text-rust">
                    ₹{summary?.totalSpent.toLocaleString() || 0}
                  </p>
                </div>
              </div>

              {/* <div className="flex items-center justify-between mt-4 pt-3 border-t border-paper-dim">
                <div className="text-xs text-muted">
                  <CalendarDays size={12} className="inline mr-1" />
                  {event.eventDate}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/events/collections?eventId=${event.id}`}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-ink/5 text-ink hover:bg-ink/10 transition-colors"
                  >
                    <Wallet size={12} />
                    Collections
                  </Link>
                  <Link
                    href={`/admin/events/expenses?eventId=${event.id}`}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-ink/5 text-ink hover:bg-ink/10 transition-colors"
                  >
                    <Receipt size={12} />
                    Expenses
                  </Link>
                </div>
              </div> */}

              {/* // REPLACE this block inside the event card (around the bottom flex): */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-paper-dim">
                <div className="text-xs text-muted">
                  <CalendarDays size={12} className="inline mr-1" />
                  {event.eventDate}
                </div>
                <Link
                  href={`/admin/events/${event.id}`}
                  className="text-xs px-4 py-1.5 bg-brass text-ink font-semibold uppercase tracking-wide hover:bg-brass-light transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="text-center py-16 bg-white border border-paper-dim">
          <CalendarDays size={40} className="mx-auto text-muted/40 mb-3" />
          <p className="text-sm text-muted">
            No events yet. Create your first event.
          </p>
        </div>
      )}

      {modal && (
        <EventModal
          event={typeof modal === "object" ? modal.edit : undefined}
          adminSocietyId={admin?.societyId}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            refreshEvents();
          }}
        />
      )}
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
    <span
      className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${map[status]}`}
    >
      {status}
    </span>
  );
}

function EventModal({
  event,
  adminSocietyId,
  isSuperAdmin,
  onClose,
  onSaved,
}: {
  event?: SocietyEvent;
  adminSocietyId?: string;
  isSuperAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!event;
  const societies = getAllSocieties();
  const [form, setForm] = useState({
    name: event?.name || "",
    description: event?.description || "",
    eventDate: event?.eventDate || "",
    status: (event?.status as EventStatus) || "upcoming",
    budget: String(event?.budget || ""),
    societyId: event?.societyId || adminSocietyId || societies[0]?.id || "",
  });
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      eventDate: form.eventDate,
      status: form.status as EventStatus,
      budget: Number(form.budget),
      societyId: form.societyId,
    };
    if (isEdit) {
      updateEvent(event.id, payload);
    } else {
      addEvent(payload);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="bg-white w-full max-w-md border border-paper-dim p-6 shadow-pin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl italic text-ink">
            {isEdit ? "Edit Event" : "Add Event"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">
              Event Name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">
                Event Date
              </label>
              <input
                type="date"
                required
                value={form.eventDate}
                onChange={(e) => update("eventDate", e.target.value)}
                className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">
                Status
              </label>
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
            <label className="text-xs uppercase tracking-wide text-muted">
              Budget (₹)
            </label>
            <input
              type="number"
              required
              value={form.budget}
              onChange={(e) => update("budget", e.target.value)}
              className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
            />
          </div>
          {isSuperAdmin && (
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">
                Society
              </label>
              <select
                value={form.societyId}
                onChange={(e) => update("societyId", e.target.value)}
                className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
              >
                {societies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
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
