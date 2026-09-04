"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getRole,
  deleteRole,
  listRolePermissions,
  assignRolePermission,
  removeRolePermission,
} from "@/lib/api/roles";
import { listPermissions } from "@/lib/api/permissions";
import type { BackendRole, BackendPermission } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import RoleForm from "@/components/admin/forms/RoleForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError || err instanceof ApiNetworkError ? err.message : fallback;
}

function EditRoleContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? Number(params.id) : NaN;
  const router = useRouter();

  const [role, setRole] = useState<BackendRole | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [catalog, setCatalog] = useState<BackendPermission[] | null>(null);
  const [assigned, setAssigned] = useState<Map<number, BackendPermission> | null>(null);
  const [permError, setPermError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function refreshAssigned() {
    if (!Number.isFinite(id)) return;
    listRolePermissions(id)
      .then((perms) => setAssigned(new Map(perms.map((p) => [p.id, p]))))
      .catch((err) => setPermError(errorMessage(err, "Couldn't load this role's permissions.")));
  }

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid role id.");
      return;
    }
    getRole(id)
      .then(setRole)
      .catch((err) => setLoadError(errorMessage(err, "This role may have already been removed.")));

    listPermissions({ limit: 200 })
      .then((res) => setCatalog(res.data))
      .catch((err) => setPermError(errorMessage(err, "Couldn't load the permission catalog.")));

    refreshAssigned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const grouped = useMemo(() => {
    if (!catalog) return null;
    const byResource = new Map<string, BackendPermission[]>();
    for (const perm of catalog) {
      const list = byResource.get(perm.resource) ?? [];
      list.push(perm);
      byResource.set(perm.resource, list);
    }
    return [...byResource.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [catalog]);

  async function handleDelete() {
    try {
      await deleteRole(id);
      router.push("/admin/dashboard/roles");
    } catch (err) {
      setActionError(errorMessage(err, "Couldn't delete this role."));
    }
  }

  async function toggle(perm: BackendPermission, isAssigned: boolean) {
    setPermError(null);
    setBusyId(perm.id);
    try {
      if (isAssigned) {
        await removeRolePermission(id, perm.id);
      } else {
        await assignRolePermission(id, perm.id);
      }
      refreshAssigned();
    } catch (err) {
      setPermError(errorMessage(err, `Couldn't update "${perm.name}".`));
    } finally {
      setBusyId(null);
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Role not found" description={loadError} />
        <Button
          href="/admin/dashboard/roles"
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to roles
        </Button>
      </div>
    );
  }

  if (!role) {
    return <div className="py-16 text-center text-ink/40">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Edit ${role.name}`}
        description={
          role.society_id === null
            ? "This is a global role — changes here apply everywhere it's used, across every society."
            : "Update this role's name/description, or manage what it can do below."
        }
        action={<ConfirmDeleteButton label={role.name} onConfirm={handleDelete} />}
      />
      {actionError && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {actionError}
        </p>
      )}

      <Card className="max-w-2xl p-8">
        <RoleForm initial={role} submitLabel="Save changes" onSaved={setRole} />
      </Card>

      <Card className="flex flex-col gap-5 p-8">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-lg text-ink">Permissions</h2>
          <p className="text-sm text-ink/50">
            Toggling a permission takes effect immediately — there's no separate save step.
          </p>
        </div>

        {permError && <p className="text-sm text-rust">{permError}</p>}
        {(!grouped || !assigned) && !permError && (
          <p className="text-sm text-ink/40">Loading permissions…</p>
        )}

        {grouped && assigned && (
          <div className="flex flex-col gap-6">
            {grouped.map(([resource, perms]) => (
              <div key={resource} className="flex flex-col gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
                  {resource.replace(/_/g, " ")}
                </span>
                <div className="flex flex-wrap gap-2">
                  {perms.map((perm) => {
                    const isAssigned = assigned.has(perm.id);
                    const isBusy = busyId === perm.id;
                    return (
                      <label
                        key={perm.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-2 text-sm transition-colors ${
                          isAssigned
                            ? "border-brass bg-brass/10 text-brass-dark"
                            : "border-ink/15 text-ink/70 hover:border-ink/30"
                        } ${isBusy ? "opacity-50" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="accent-brass"
                          checked={isAssigned}
                          disabled={isBusy}
                          onChange={() => toggle(perm, isAssigned)}
                        />
                        {perm.action}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function EditRolePage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <EditRoleContent />
    </RequireRole>
  );
}
