"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAnnouncement, deleteAnnouncement, sendAnnouncement } from "@/lib/api/announcements";
import type { BackendAnnouncement } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import NoticeForm from "@/components/admin/forms/NoticeForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError || err instanceof ApiNetworkError ? err.message : fallback;
}

function EditNoticeContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? Number(params.id) : NaN;
  const router = useRouter();

  const [notice, setNotice] = useState<BackendAnnouncement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid notice id.");
      return;
    }
    getAnnouncement(id)
      .then(setNotice)
      .catch((err) => setLoadError(errorMessage(err, "This notice may have already been removed.")));
  }, [id]);

  async function handleDelete() {
    try {
      await deleteAnnouncement(id);
      router.push("/admin/dashboard/notices");
    } catch (err) {
      setActionError(errorMessage(err, "Couldn't delete this notice."));
    }
  }

  async function handleSend() {
    setActionError(null);
    setSending(true);
    try {
      const updated = await sendAnnouncement(id);
      setNotice(updated);
    } catch (err) {
      setActionError(errorMessage(err, "Couldn't send this notice."));
    } finally {
      setSending(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Notice not found" description={loadError} />
        <Button
          href="/admin/dashboard/notices"
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to notices
        </Button>
      </div>
    );
  }

  if (!notice) {
    return <div className="py-16 text-center text-ink/40">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Edit notice"
        description={
          notice.sent_at
            ? `Sent on ${new Date(notice.sent_at).toLocaleDateString()}.`
            : "Not sent yet — changes here won't reach anyone until you send it."
        }
        action={
          <div className="flex items-center gap-2">
            {!notice.sent_at && (
              <Button type="button" variant="secondary" disabled={sending} onClick={handleSend}>
                {sending ? "Sending…" : "Send now"}
              </Button>
            )}
            <ConfirmDeleteButton label={notice.title} onConfirm={handleDelete} />
          </div>
        }
      />
      {actionError && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {actionError}
        </p>
      )}
      <Card className="max-w-2xl p-8">
        <NoticeForm initial={notice} submitLabel="Save changes" onSaved={setNotice} />
      </Card>
    </div>
  );
}

export default function EditNoticePage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <EditNoticeContent />
    </RequireRole>
  );
}
