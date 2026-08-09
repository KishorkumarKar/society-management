"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getAllNotices,
  getNoticeById,
  getAllSocieties,
  deleteNotice,
} from "@/lib/data";
import {
  ArrowLeft,
  Calendar,
  Building2,
  Tag,
  Trash2,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { useState } from "react";

import { use } from "react";

interface NoticePageProps {
  params: Promise<{
    noticeId: string;
  }>;
}

export default function NoticeDetailPage({ params }: NoticePageProps) {
  const router = useRouter();
  const { admin } = useAuth();
  // const noticeId = params.noticeId;
  const { noticeId } = use(params);

  const [refreshKey, setRefreshKey] = useState(0);

  //  const [refreshKey, setRefreshKey] = useState(0);

  console.log(noticeId, getAllNotices());

  const noticeRaw =
    getNoticeById?.(noticeId) || getAllNotices().find((n) => n.id === noticeId);

  if (!noticeRaw) {
    return (
      <div className="text-center py-20">
        <h2 className="font-display text-xl italic text-ink">
          Notice Not Found
        </h2>
        <button
          onClick={() => router.push("/admin/notices")}
          className="mt-4 text-sm text-brass underline"
        >
          ← Back to Notices
        </button>
      </div>
    );
  }

  const notice = noticeRaw;
  //   const notice = getNoticeById?.(noticeId) || getAllNotices().find((n) => n.id === noticeId);

  // Update lib/data.ts to add getNoticeById if not present
  // For now, fallback to find

  const isSuperAdmin = admin?.role === "super_admin";
  const canEdit = isSuperAdmin || notice?.societyId === admin?.societyId;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: notice?.title || "",
    category: notice?.category || "General",
    date: notice?.date || "",
    body: notice?.body || "",
  });

  if (!notice) {
    return (
      <div className="text-center py-20">
        <h2 className="font-display text-xl italic text-ink">
          Notice Not Found
        </h2>
        <button
          onClick={() => router.push("/admin/notices")}
          className="mt-4 text-sm text-brass underline"
        >
          ← Back to Notices
        </button>
      </div>
    );
  }

  const society = getAllSocieties().find((s) => s.id === notice.societyId);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function save() {
    const { updateNotice } = require("@/lib/data");
    updateNotice(notice.id, {
      title: form.title,
      category: form.category,
      date: form.date,
      body: form.body,
    });
    setEditing(false);
    setRefreshKey((k) => k + 1);
    // Force re-read
    const updated = getAllNotices().find((n) => n.id === notice.id);
    if (updated) {
      Object.assign(notice, updated);
    }
  }

  function handleDelete() {
    if (!confirm("Delete this notice permanently?")) return;
    deleteNotice(notice.id);
    router.push("/admin/notices");
  }

  return (
    <div key={refreshKey}>
      <button
        onClick={() => router.push("/admin/notices")}
        className="flex items-center gap-1 text-sm text-muted hover:text-ink mb-4"
      >
        <ArrowLeft size={14} /> Back to Notices
      </button>

      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  className="w-full font-display text-2xl italic text-ink border border-paper-dim bg-white px-3 py-2 focus:border-brass outline-none"
                />
                <div className="flex gap-3">
                  <select
                    value={form.category}
                    onChange={(e) => update("category", e.target.value)}
                    className="border border-paper-dim bg-white px-3 py-1.5 text-sm text-ink focus:border-brass outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Security">Security</option>
                    <option value="Event">Event</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => update("date", e.target.value)}
                    className="border border-paper-dim bg-white px-3 py-1.5 text-sm text-ink focus:border-brass outline-none"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-display text-2xl italic text-ink">
                    {notice.title}
                  </h1>
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 bg-ink/5 text-ink rounded">
                    {notice.category}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(notice.date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 size={12} />
                    {society?.name || notice.societyId}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag size={12} />
                    {notice.category}
                  </span>
                </div>
              </>
            )}
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 ml-4">
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wide text-muted border border-paper-dim hover:border-ink transition-colors"
                  >
                    <X size={12} /> Cancel
                  </button>
                  <button
                    onClick={save}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wide text-ink bg-brass hover:bg-brass-light transition-colors"
                  >
                    <Check size={12} /> Save
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wide text-brass border border-brass/30 hover:bg-brass/10 transition-colors"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs uppercase tracking-wide text-rust border border-rust/30 hover:bg-rust/10 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="bg-white border border-paper-dim p-6 shadow-sm">
          {editing ? (
            <textarea
              rows={12}
              value={form.body}
              onChange={(e) => update("body", e.target.value)}
              className="w-full text-sm text-ink leading-relaxed border border-paper-dim bg-paper px-3 py-2 focus:border-brass outline-none resize-none"
            />
          ) : (
            <div className="prose prose-sm max-w-none text-ink/80 leading-relaxed whitespace-pre-wrap">
              {notice.body}
            </div>
          )}
        </div>

        {/* Footer meta */}
        {!editing && (
          <div className="mt-4 flex items-center justify-between text-xs text-muted">
            <span>
              Notice ID: <span className="font-mono">{notice.id}</span>
            </span>
            <span>Society: {society?.name || notice.societyId}</span>
          </div>
        )}
      </div>
    </div>
  );
}
