"use client";

import { useState, type FormEvent } from "react";
import { createRole, updateRole, type CreateRolePayload } from "@/lib/api/roles";
import type { BackendRole } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

interface RoleFormProps {
  initial?: BackendRole;
  submitLabel: string;
  onSaved: (role: BackendRole) => void;
}

/**
 * Creates/renames a role. Permissions are handled separately (see the
 * "Permissions" panel on the edit page) — `updateRoleSchema` has no
 * permissions field, and a freshly created role starts with none assigned.
 */
export default function RoleForm({ initial, submitLabel, onSaved }: RoleFormProps) {
  const isEditing = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isGlobal, setIsGlobal] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Role name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const saved =
        isEditing && initial
          ? await updateRole(initial.id, { name, description: description || null })
          : await createRole({
              name,
              description: description || null,
              ...(isGlobal ? { isGlobal: true } : {}),
            } satisfies CreateRolePayload);
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't save this role. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="role-name"
        label="Role name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Assistant Secretary"
      />

      <Textarea
        id="role-description"
        label="Description (optional)"
        rows={3}
        value={description ?? ""}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What is this role for?"
      />

      {!isEditing && (
        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            className="accent-brass"
            checked={isGlobal}
            onChange={(e) => setIsGlobal(e.target.checked)}
          />
          Global role (assignable across every society, like Super Admin) — usually left off
        </label>
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
