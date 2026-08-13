"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import type { SecurityGuard, GuardStatus } from "@/lib/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface GuardFormProps {
  initial?: SecurityGuard;
  submitLabel: string;
  onSubmit: (input: Omit<SecurityGuard, "id">) => void;
}

export default function GuardForm({ initial, submitLabel, onSubmit }: GuardFormProps) {
  const { user: currentUser } = useAuth();
  const { societies } = useData();
  const isSuperAdmin = currentUser?.role === "super-admin";

  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [employeeCode, setEmployeeCode] = useState(initial?.employeeCode ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [joiningDate, setJoiningDate] = useState(initial?.joiningDate ?? "");
  const [status, setStatus] = useState<GuardStatus>(initial?.status ?? "active");
  const [societyId, setSocietyId] = useState(
    initial?.societyId ?? (isSuperAdmin ? "" : currentUser?.societyId ?? "")
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const finalSocietyId = isSuperAdmin ? societyId : currentUser?.societyId ?? "";
    if (!finalSocietyId) {
      setError("Choose a society for this guard.");
      return;
    }
    if (!name.trim() || !phone.trim() || !employeeCode.trim()) {
      setError("Name, phone and employee code are required.");
      return;
    }

    onSubmit({
      societyId: finalSocietyId,
      name,
      phone,
      employeeCode,
      address,
      joiningDate,
      status,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {isSuperAdmin ? (
        <Select
          id="guard-society"
          label="Society"
          required
          value={societyId}
          onChange={(e) => setSocietyId(e.target.value)}
        >
          <option value="" disabled>
            Select a society
          </option>
          {societies.map((society) => (
            <option key={society.id} value={society.id}>
              {society.name}
            </option>
          ))}
        </Select>
      ) : (
        <Input id="guard-society-fixed" label="Society" value={currentUser?.societyName ?? ""} disabled />
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input id="guard-name" label="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input id="guard-code" label="Employee code" required value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} placeholder="e.g. GRD-GW-03" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input id="guard-phone" label="Phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input id="guard-joining" label="Joining date" type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
      </div>

      <Input id="guard-address" label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />

      <Select id="guard-status" label="Status" required value={status} onChange={(e) => setStatus(e.target.value as GuardStatus)}>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </Select>

      {error && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <div>
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
