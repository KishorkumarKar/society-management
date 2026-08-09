"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getAllNotices,
  getNoticesBySociety,
  addNotice,
  updateNotice,
  deleteNotice,
  getAllSocieties,
} from "@/lib/data";
import type { Notice } from "@/lib/types";
import { Bell, Pencil, Trash2, Plus, X } from "lucide-react";
import Link from "next/link";

export default function NoticesPage() {
  const { admin } = useAuth();
  const isSuperAdmin = admin?.role === "super_admin";
  const [notices, setNotices] = useState<Notice[]>(
    isSuperAdmin
      ? getAllNotices()
      : getNoticesBySociety(admin?.societyId || ""),
  );
  const [modal, setModal] = useState<"add" | { edit: Notice } | null>(null);

  function handleDelete(id: string) {
    if (!confirm("Delete this notice?")) return;
    deleteNotice(id);
    refreshNotices();
  }

  function refreshNotices() {
    setNotices(
      isSuperAdmin
        ? getAllNotices()
        : getNoticesBySociety(admin?.societyId || ""),
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl italic text-ink">Notices</h1>
          <p className="text-sm text-muted mt-0.5">
            {isSuperAdmin
              ? "Manage all society notices"
              : "Manage your society notices"}
          </p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 bg-brass text-ink text-sm font-semibold uppercase tracking-wide px-4 py-2.5 hover:bg-brass-light transition-colors"
        >
          <Plus size={16} />
          Add Notice
        </button>
      </div>

      <div className="bg-white border border-paper-dim overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium text-ink">Title</th>
              <th className="px-4 py-3 font-medium text-ink">Category</th>
              <th className="px-4 py-3 font-medium text-ink">Date</th>
              {isSuperAdmin && (
                <th className="px-4 py-3 font-medium text-ink">Society</th>
              )}
              <th className="px-4 py-3 font-medium text-ink text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-dim">
            {notices.map((n) => (
              <tr key={n.id} className="hover:bg-paper/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{n.title}</div>
                  <div className="text-xs text-muted line-clamp-1 max-w-xs">
                    {n.body}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 bg-ink/5 text-ink rounded">
                    {n.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink/80">{n.date}</td>
                {isSuperAdmin && (
                  <td className="px-4 py-3 text-ink/80 text-xs">
                    {getAllSocieties().find((s) => s.id === n.societyId)
                      ?.name || n.societyId}
                  </td>
                )}
                <td className="px-4 py-3 text-right space-x-2">
                  <Link
                    href={`/admin/notices/${n.id}`}
                    className="inline-flex items-center gap-1 text-xs text-ink hover:text-brass underline"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => setModal({ edit: n })}
                    className="inline-flex items-center gap-1 text-xs text-brass hover:text-brass-dark underline"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="inline-flex items-center gap-1 text-xs text-rust hover:text-rust underline"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {notices.length === 0 && (
          <p className="text-sm text-muted text-center py-8">
            No notices found.
          </p>
        )}
      </div>

      {modal && (
        <NoticeModal
          notice={typeof modal === "object" ? modal.edit : undefined}
          adminSocietyId={admin?.societyId}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            refreshNotices();
          }}
        />
      )}
    </div>
  );
}

function NoticeModal({
  notice,
  adminSocietyId,
  isSuperAdmin,
  onClose,
  onSaved,
}: {
  notice?: Notice;
  adminSocietyId?: string;
  isSuperAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!notice;
  const societies = getAllSocieties();
  const [form, setForm] = useState({
    title: notice?.title || "",
    category: notice?.category || "General",
    date: notice?.date || new Date().toISOString().split("T")[0],
    body: notice?.body || "",
    societyId: notice?.societyId || adminSocietyId || societies[0]?.id || "",
  });
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title,
      category: form.category,
      date: form.date,
      body: form.body,
      societyId: form.societyId,
    };
    if (isEdit) {
      updateNotice(notice.id, payload);
    } else {
      addNotice(payload);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto border border-paper-dim p-6 shadow-pin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl italic text-ink">
            {isEdit ? "Edit Notice" : "Add Notice"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">
              Title
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
              >
                <option value="General">General</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Security">Security</option>
                <option value="Event">Event</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">
                Date
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
              />
            </div>
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
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">
              Body
            </label>
            <textarea
              required
              rows={5}
              value={form.body}
              onChange={(e) => update("body", e.target.value)}
              className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none resize-none"
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
