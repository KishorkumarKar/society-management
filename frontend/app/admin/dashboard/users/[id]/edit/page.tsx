"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getUser,
  updateUser,
  deleteUser,
  getUserPermissions,
  assignUserRole,
  removeUserRole,
  type UpdateUserPayload,
} from "@/lib/api/users";
import { listFlats } from "@/lib/api/flats";
import { listRoles } from "@/lib/api/roles";
import type { BackendUser, BackendFlat, BackendRole } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import RequireRole from "@/components/admin/RequireRole";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError || err instanceof ApiNetworkError ? err.message : fallback;
}

function EditUserContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? Number(params.id) : NaN;
  const router = useRouter();

  const [user, setUser] = useState<BackendUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [flatId, setFlatId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [flats, setFlats] = useState<BackendFlat[] | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [roles, setRoles] = useState<BackendRole[] | null>(null);
  const [roleToAssign, setRoleToAssign] = useState("");
  const [roleActionError, setRoleActionError] = useState<string | null>(null);
  const [roleActionBusy, setRoleActionBusy] = useState(false);

  function refreshPermissions() {
    if (!Number.isFinite(id)) return;
    getUserPermissions(id)
      .then((res) => setPermissions(res.permissions))
      .catch(() => setPermissions([]));
  }

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid user id.");
      return;
    }
    getUser(id)
      .then((u) => {
        setUser(u);
        setName(u.name);
        setEmail(u.email ?? "");
        setPhone(u.phone ?? "");
        setFlatId(u.flatId ? String(u.flatId) : "");
        setIsActive(u.isActive);
      })
      .catch((err) => setLoadError(errorMessage(err, "Couldn't load this user.")));

    listFlats({ limit: 100 })
      .then((res) => setFlats(res.data))
      .catch(() => setFlats([]));
    listRoles({ limit: 100 })
      .then((res) => setRoles(res.data))
      .catch(() => setRoles([]));

    refreshPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);

    const payload: UpdateUserPayload = {
      name,
      isActive,
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      flatId: flatId ? Number(flatId) : null,
    };

    setSaving(true);
    try {
      const updated = await updateUser(id, payload);
      setUser(updated);
      router.push("/admin/dashboard/users");
    } catch (err) {
      setSaveError(errorMessage(err, "Couldn't save these changes."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteUser(id);
      router.push("/admin/dashboard/users");
    } catch (err) {
      setSaveError(errorMessage(err, "Couldn't delete this user."));
    }
  }

  async function handleAssignRole() {
    if (!roleToAssign) return;
    setRoleActionError(null);
    setRoleActionBusy(true);
    try {
      await assignUserRole(id, Number(roleToAssign));
      refreshPermissions();
    } catch (err) {
      setRoleActionError(errorMessage(err, "Couldn't assign that role."));
    } finally {
      setRoleActionBusy(false);
    }
  }

  async function handleRemoveRole() {
    if (!roleToAssign) return;
    setRoleActionError(null);
    setRoleActionBusy(true);
    try {
      await removeUserRole(id, Number(roleToAssign));
      refreshPermissions();
    } catch (err) {
      setRoleActionError(errorMessage(err, "Couldn't remove that role."));
    } finally {
      setRoleActionBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="User not found" description={loadError} />
        <Button
          href="/admin/dashboard/users"
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to users
        </Button>
      </div>
    );
  }

  if (!user) {
    return <div className="py-16 text-center text-ink/40">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Edit ${user.name}`}
        description="Update this member's details, or manage their roles below."
        action={<ConfirmDeleteButton label={user.name} onConfirm={handleDelete} />}
      />

      <Card className="max-w-2xl p-8">
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <Input id="user-name" label="Full name" required value={name} onChange={(e) => setName(e.target.value)} />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input id="user-email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input id="user-phone" label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <Select
            id="user-flat"
            label="Flat"
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

          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              className="accent-brass"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active (can sign in)
          </label>

          {saveError && (
            <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
              {saveError}
            </p>
          )}

          <div>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="max-w-2xl flex flex-col gap-4 p-8">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-lg text-ink">Roles &amp; access</h2>
          <p className="text-sm text-ink/50">
            The backend doesn&apos;t expose which roles a user currently holds directly — only
            their combined effective permissions, shown below. Assign or remove a role by
            picking it and choosing an action.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {permissions === null && <span className="text-sm text-ink/40">Loading…</span>}
          {permissions?.length === 0 && (
            <span className="text-sm text-ink/40">No permissions — this user has no roles assigned.</span>
          )}
          {permissions?.map((perm) => (
            <Badge key={perm} tone="muted">
              {perm}
            </Badge>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-ink/10 pt-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              id="role-picker"
              label="Role"
              value={roleToAssign}
              onChange={(e) => setRoleToAssign(e.target.value)}
              disabled={!roles}
            >
              <option value="">Choose a role…</option>
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              disabled={!roleToAssign || roleActionBusy}
              onClick={handleAssignRole}
            >
              Assign
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!roleToAssign || roleActionBusy}
              onClick={handleRemoveRole}
              className="!border-ink/20 !text-ink hover:!border-rust hover:!text-rust"
            >
              Remove
            </Button>
          </div>
        </div>
        {roleActionError && <p className="text-sm text-rust">{roleActionError}</p>}
      </Card>
    </div>
  );
}

export default function EditUserPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <EditUserContent />
    </RequireRole>
  );
}
