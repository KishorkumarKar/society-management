"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  createAnnouncement,
  updateAnnouncement,
  type CreateAnnouncementPayload,
} from "@/lib/api/announcements";
import { listRoles } from "@/lib/api/roles";
import type { BackendAnnouncement, BackendRole } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"] as const;

interface NoticeFormProps {
  initial?: BackendAnnouncement;
  submitLabel: string;
  onSaved: (notice: BackendAnnouncement) => void;
}

export default function NoticeForm({ initial, submitLabel, onSaved }: NoticeFormProps) {
  const isEditing = !!initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [priority, setPriority] = useState<(typeof PRIORITY_OPTIONS)[number]>(
    initial?.priority ?? "normal"
  );
  const [targetRoleIds, setTargetRoleIds] = useState<number[]>(initial?.targetRoleIds ?? []);

  const [roles, setRoles] = useState<BackendRole[] | null>(null);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listRoles({ limit: 100 })
      .then((res) => setRoles(res.data))
      .catch((err) =>
        setRolesError(
          err instanceof ApiError || err instanceof ApiNetworkError
            ? err.message
            : "Couldn't load roles for targeting."
        )
      );
  }, []);

  function toggleRole(roleId: number) {
    setTargetRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !body.trim()) {
      setError("Title and body are both required.");
      return;
    }

    const payload: CreateAnnouncementPayload = {
      title: title.trim(),
      body: body.trim(),
      priority,
      targetRoleIds,
    };

    setSubmitting(true);
    try {
      const saved =
        isEditing && initial ? await updateAnnouncement(initial.id, payload) : await createAnnouncement(payload);
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't save this notice. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input id="notice-title" label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />

      <Textarea
        id="notice-body"
        label="Body"
        required
        rows={5}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <Select
        id="notice-priority"
        label="Priority"
        value={priority}
        onChange={(e) => setPriority(e.target.value as (typeof PRIORITY_OPTIONS)[number])}
      >
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {p[0].toUpperCase() + p.slice(1)}
          </option>
        ))}
      </Select>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-wider text-ink/60">
          Audience
        </span>
        <p className="-mt-1 text-xs text-ink/40">
          Leave every role unchecked to post society-wide. Check specific roles to target only
          them.
        </p>
        {rolesError && <p className="text-sm text-rust">{rolesError}</p>}
        {!rolesError && !roles && <p className="text-sm text-ink/40">Loading roles…</p>}
        <div className="flex flex-wrap gap-2">
          {roles?.map((role) => (
            <label
              key={role.id}
              className={`flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-2 text-sm transition-colors ${
                targetRoleIds.includes(role.id)
                  ? "border-brass bg-brass/10 text-brass-dark"
                  : "border-ink/15 text-ink/70 hover:border-ink/30"
              }`}
            >
              <input
                type="checkbox"
                className="accent-brass"
                checked={targetRoleIds.includes(role.id)}
                onChange={() => toggleRole(role.id)}
              />
              {role.name}
            </label>
          ))}
        </div>
      </div>

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
