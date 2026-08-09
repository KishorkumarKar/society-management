"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAllSocieties, addSociety, updateSociety, deleteSociety } from "@/lib/data";
import type { Society } from "@/lib/types";
import { Building2, Pencil, Trash2, Plus, X } from "lucide-react";

export default function SocietiesPage() {
  const { admin } = useAuth();
  const [societies, setSocieties] = useState<Society[]>(getAllSocieties());
  const [modal, setModal] = useState<"add" | { edit: Society } | null>(null);
  const [refresh, setRefresh] = useState(0);

  if (admin?.role !== "super_admin") {
    return (
      <div className="text-center py-20">
        <h2 className="font-display text-xl italic text-ink">Access Denied</h2>
        <p className="text-sm text-muted mt-2">Only Super Admin can manage societies.</p>
      </div>
    );
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this society?")) return;
    deleteSociety(id);
    setRefresh((r) => r + 1);
    setSocieties(getAllSocieties());
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl italic text-ink">Societies</h1>
          <p className="text-sm text-muted mt-0.5">Manage all housing societies</p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="flex items-center gap-2 bg-brass text-ink text-sm font-semibold uppercase tracking-wide px-4 py-2.5 hover:bg-brass-light transition-colors"
        >
          <Plus size={16} />
          Add Society
        </button>
      </div>

      <div className="bg-white border border-paper-dim overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 text-left text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-medium text-ink">Name</th>
              <th className="px-4 py-3 font-medium text-ink">City</th>
              <th className="px-4 py-3 font-medium text-ink">Units</th>
              <th className="px-4 py-3 font-medium text-ink">Occupied</th>
              <th className="px-4 py-3 font-medium text-ink">Reg. No</th>
              <th className="px-4 py-3 font-medium text-ink text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-dim">
            {societies.map((s) => (
              <tr key={s.id} className="hover:bg-paper/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{s.name}</div>
                  <div className="text-xs text-muted">{s.slug}</div>
                </td>
                <td className="px-4 py-3 text-ink/80">{s.city}</td>
                <td className="px-4 py-3 text-ink/80">{s.totalUnits}</td>
                <td className="px-4 py-3 text-ink/80">{s.occupiedUnits}</td>
                <td className="px-4 py-3 text-ink/80 font-mono text-xs">{s.registrationNo}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => setModal({ edit: s })} className="inline-flex items-center gap-1 text-xs text-brass hover:text-brass-dark underline">
                    <Pencil size={12} /> Edit
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="inline-flex items-center gap-1 text-xs text-rust hover:text-rust underline">
                    <Trash2 size={12} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <SocietyModal
          society={typeof modal === "object" ? modal.edit : undefined}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            setSocieties(getAllSocieties());
          }}
        />
      )}
    </div>
  );
}

function SocietyModal({
  society,
  onClose,
  onSaved,
}: {
  society?: Society;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!society;
  const [form, setForm] = useState({
    name: society?.name || "",
    slug: society?.slug || "",
    city: society?.city || "",
    address: society?.address || "",
    registrationNo: society?.registrationNo || "",
    totalUnits: String(society?.totalUnits || ""),
    occupiedUnits: String(society?.occupiedUnits || ""),
    established: String(society?.established || new Date().getFullYear()),
    initial: society?.initial || "",
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
      slug: form.slug,
      city: form.city,
      address: form.address,
      registrationNo: form.registrationNo,
      totalUnits: Number(form.totalUnits),
      occupiedUnits: Number(form.occupiedUnits),
      established: Number(form.established),
      initial: form.initial,
    };
    if (isEdit) {
      updateSociety(society.id, payload);
    } else {
      addSociety(payload);
    }
    setSaving(false);
    onSaved();
  }

  const fields = [
    { label: "Name", key: "name", type: "text" },
    { label: "Slug", key: "slug", type: "text" },
    { label: "City", key: "city", type: "text" },
    { label: "Address", key: "address", type: "text" },
    { label: "Registration No", key: "registrationNo", type: "text" },
    { label: "Total Units", key: "totalUnits", type: "number" },
    { label: "Occupied Units", key: "occupiedUnits", type: "number" },
    { label: "Established Year", key: "established", type: "number" },
    { label: "Initial", key: "initial", type: "text" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto border border-paper-dim p-6 shadow-pin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl italic text-ink">{isEdit ? "Edit Society" : "Add Society"}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-xs uppercase tracking-wide text-muted">{f.label}</label>
              <input
                type={f.type}
                required
                value={form[f.key as keyof typeof form]}
                onChange={(e) => update(f.key, e.target.value)}
                className="mt-1 w-full border border-paper-dim bg-paper px-3 py-2 text-sm text-ink focus:border-brass outline-none"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-paper-dim px-4 py-2 text-sm text-ink hover:border-ink transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-brass text-ink font-semibold text-sm uppercase tracking-wide px-4 py-2 hover:bg-brass-light transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}