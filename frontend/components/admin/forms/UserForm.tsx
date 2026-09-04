"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createUser, type CreateUserPayload } from "@/lib/api/users";
import { listFlats } from "@/lib/api/flats";
import { listRoles } from "@/lib/api/roles";
import type { BackendFlat, BackendRole, BackendUser } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface UserFormProps {
  onCreated: (user: BackendUser) => void;
  submitLabel: string;
}

/**
 * Creates a user against the real backend (`POST /users`). There is no
 * "edit roles" here — `updateUserSchema` doesn't accept `roleIds`, so
 * changing an existing user's roles after creation is a separate action
 * (see the Roles panel on the edit page) rather than part of this form.
 */
export default function UserForm({ onCreated, submitLabel }: UserFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [flatId, setFlatId] = useState<string>("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  const [flats, setFlats] = useState<BackendFlat[] | null>(null);
  const [roles, setRoles] = useState<BackendRole[] | null>(null);
  const [pickersError, setPickersError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([listFlats({ limit: 100 }), listRoles({ limit: 100 })])
      .then(([flatsResult, rolesResult]) => {
        setFlats(flatsResult.data);
        setRoles(rolesResult.data);
      })
      .catch((err) => {
        setPickersError(
          err instanceof ApiError || err instanceof ApiNetworkError
            ? err.message
            : "Couldn't load flats/roles for this form."
        );
      });
  }, []);

  function toggleRole(roleId: number) {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() && !phone.trim()) {
      setError("Enter an email or a phone number (at least one is required).");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const payload: CreateUserPayload = {
      name,
      password,
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(flatId ? { flatId: Number(flatId) } : {}),
      ...(selectedRoleIds.length ? { roleIds: selectedRoleIds } : {}),
    };

    setSubmitting(true);
    try {
      const created = await createUser(payload);
      onCreated(created);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't create this user. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input id="user-name" label="Full name" required value={name} onChange={(e) => setName(e.target.value)} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          id="user-email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Leave blank if using phone"
        />
        <Input
          id="user-phone"
          label="Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Leave blank if using email"
        />
      </div>

      <Input
        id="user-password"
        label="Password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
      />

      <Select
        id="user-flat"
        label="Flat (optional)"
        value={flatId}
        onChange={(e) => setFlatId(e.target.value)}
        disabled={!flats}
      >
        <option value="">No flat assigned</option>
        {flats?.map((flat) => (
          <option key={flat.id} value={flat.id}>
            {flat.block} · {flat.unit_no} (floor {flat.floor})
          </option>
        ))}
      </Select>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-wider text-ink/60">
          Roles (optional)
        </span>
        {pickersError && <p className="text-sm text-rust">{pickersError}</p>}
        {!pickersError && !roles && <p className="text-sm text-ink/40">Loading roles…</p>}
        {roles && roles.length === 0 && (
          <p className="text-sm text-ink/40">No roles have been created for this society yet.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {roles?.map((role) => (
            <label
              key={role.id}
              className={`flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-2 text-sm transition-colors ${
                selectedRoleIds.includes(role.id)
                  ? "border-brass bg-brass/10 text-brass-dark"
                  : "border-ink/15 text-ink/70 hover:border-ink/30"
              }`}
            >
              <input
                type="checkbox"
                className="accent-brass"
                checked={selectedRoleIds.includes(role.id)}
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
          {submitting ? "Creating…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
