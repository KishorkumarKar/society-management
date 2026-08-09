"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/Pagination";
import {
  getAllUsers,
  getUsersBySociety,
  getAllSocieties,
  addUser,
  updateUser,
  deleteUser,
} from "@/lib/data";
import type { SocietyUser, UserRole } from "@/lib/types";
import { Pencil, Trash2, Plus, X } from "lucide-react";

export default function UsersPage() {
  const { admin } = useAuth();
  const isSuperAdmin = admin?.role === "super_admin";

  // ── 1. Source of truth: raw data from lib/data ──
  const [allUsers, setAllUsers] = useState<SocietyUser[]>(() =>
    isSuperAdmin ? getAllUsers() : getUsersBySociety(admin?.societyId || ""),
  );

  console.log("UsersPage allUsers:", allUsers.length, allUsers);

  useEffect(() => {
    console.log("allUsers STATE CHANGED:", allUsers.length, allUsers);
  }, [allUsers]);

  // ── 2. Pagination derives from allUsers ──
  const {
    pageData,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setPage,
    setPageSize,
  } = usePagination<SocietyUser>({
    data: allUsers,
    initialPageSize: 10,
  });

  const [modal, setModal] = useState<"add" | { edit: SocietyUser } | null>(
    null,
  );

  // ── 3. Refresh: re-read from lib/data → set state → React re-renders → pagination recalculates ──
  const refreshUsers = useCallback(() => {
    const fresh = isSuperAdmin
      ? getAllUsers()
      : getUsersBySociety(admin?.societyId || "");

    console.log("2. fresh users:", fresh.length, fresh);
    setAllUsers([...fresh]);
    // Note: usePagination auto-clamps page if data shrank
  }, [isSuperAdmin, admin?.societyId]);

  const handleDelete = useCallback(
    (id: string) => {
      if (!confirm("Delete this user?")) return;
      deleteUser(id); // 1. mutate lib/data
      refreshUsers(); // 2. pull fresh data → setAllUsers → re-render
    },
    [refreshUsers],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl italic text-ink">Users</h1>
          <p className="text-sm text-muted mt-0.5">
            {isSuperAdmin
              ? "Manage all society users"
              : "Manage your society members"}
          </p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 bg-brass text-ink text-sm font-semibold uppercase tracking-wide px-4 py-2.5 hover:bg-brass-light transition-colors"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      <div className="bg-white border border-paper-dim overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium text-ink">Name</th>
              <th className="px-4 py-3 font-medium text-ink">Email</th>
              <th className="px-4 py-3 font-medium text-ink">Phone</th>
              <th className="px-4 py-3 font-medium text-ink">Role</th>
              <th className="px-4 py-3 font-medium text-ink">Unit</th>
              {isSuperAdmin && (
                <th className="px-4 py-3 font-medium text-ink">Society</th>
              )}
              <th className="px-4 py-3 font-medium text-ink text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-dim">
            {pageData.map((u) => (
              <tr key={u.id} className="hover:bg-paper/50">
                <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                <td className="px-4 py-3 text-ink/80">{u.email}</td>
                <td className="px-4 py-3 text-ink/80">{u.phone}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-4 py-3 text-ink/80">{u.unit}</td>
                {isSuperAdmin && (
                  <td className="px-4 py-3 text-ink/80 text-xs">
                    {getAllSocieties().find((s) => s.id === u.societyId)
                      ?.name || u.societyId}
                  </td>
                )}
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => setModal({ edit: u })}
                    className="inline-flex items-center gap-1 text-xs text-brass hover:text-brass-dark underline"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="inline-flex items-center gap-1 text-xs text-rust hover:text-rust underline"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td
                  colSpan={isSuperAdmin ? 7 : 6}
                  className="px-4 py-8 text-center text-sm text-muted"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {modal && (
        <UserModal
          user={typeof modal === "object" ? modal.edit : undefined}
          adminSocietyId={admin?.societyId}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            refreshUsers();
          }}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const map: Record<UserRole, string> = {
    super_admin: "bg-brass/10 text-brass",
    admin: "bg-brass/10 text-brass",
    committee: "bg-sage/10 text-sage",
    resident: "bg-ink/5 text-ink",
    security: "bg-rust/10 text-rust",
  };
  const label: Record<UserRole, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    committee: "Committee",
    resident: "Resident",
    security: "Security",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${map[role]}`}>
      {label[role]}
    </span>
  );
}

function UserModal({
  user,
  adminSocietyId,
  isSuperAdmin,
  onClose,
  onSaved,
}: {
  user?: SocietyUser;
  adminSocietyId?: string;
  isSuperAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!user;
  const societies = getAllSocieties();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: (user?.role as UserRole) || "resident",
    unit: user?.unit || "",
    societyId: user?.societyId || adminSocietyId || societies[0]?.id || "",
    password: "",
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
      email: form.email,
      phone: form.phone,
      role: form.role as UserRole,
      unit: form.unit,
      societyId: form.societyId,
      password: form.password || (isEdit ? user!.password : "password123"),
      initial: form.name.charAt(0).toUpperCase(),
    };

    if (isEdit) {
      updateUser(user.id, payload);
    } else {
      addUser(payload);
    }

    setSaving(false);
    onSaved(); // triggers refreshUsers() in parent
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto border border-paper-dim p-6 shadow-pin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl italic text-ink">
            {isEdit ? "Edit User" : "Add User"}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">
              Name
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
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">
              Phone
            </label>
            <input
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
              >
                <option value="resident">Resident</option>
                <option value="committee">Committee</option>
                <option value="admin">Admin</option>
                <option value="security">Security</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">
                Unit / Flat
              </label>
              <input
                required
                value={form.unit}
                onChange={(e) => update("unit", e.target.value)}
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
          {!isEdit && (
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">
                Password{" "}
                <span className="text-muted/50">(default: password123)</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Leave blank for default"
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
