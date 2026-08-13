"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import type { SocietyUser, UserRole } from "@/lib/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const ASSIGNABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Society Admin" },
  { value: "committee", label: "Committee Member" },
  { value: "resident", label: "Resident" },
  { value: "security", label: "Security Desk" },
];

interface UserFormProps {
  initial?: SocietyUser;
  onSubmit: (input: Omit<SocietyUser, "id">) => void;
  submitLabel: string;
}

export default function UserForm({ initial, onSubmit, submitLabel }: UserFormProps) {
  const { user: currentUser } = useAuth();
  const { societies } = useData();
  const isSuperAdmin = currentUser?.role === "super-admin";

  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [role, setRole] = useState<UserRole>(initial?.role ?? "resident");
  const [designation, setDesignation] = useState(initial?.designation ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [societyId, setSocietyId] = useState(
    initial?.societyId ?? (isSuperAdmin ? "" : currentUser?.societyId ?? "")
  );
  const [error, setError] = useState<string | null>(null);

  function initials(fullName: string): string {
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "??";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isSuperAdmin && !currentUser?.societyId) {
      setError("Could not determine your society.");
      return;
    }
    const finalSocietyId = isSuperAdmin ? societyId : currentUser!.societyId;
    if (!finalSocietyId) {
      setError("Choose a society for this user.");
      return;
    }

    onSubmit({
      name,
      email,
      phone,
      password,
      role,
      designation,
      unit,
      societyId: finalSocietyId,
      initial: initials(name),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {isSuperAdmin ? (
        <Select
          id="user-society"
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
        <Input
          id="user-society-fixed"
          label="Society"
          value={currentUser?.societyName ?? ""}
          disabled
        />
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input id="user-name" label="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Select id="user-role" label="Role" required value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input id="user-email" label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input id="user-phone" label="Phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          id="user-designation"
          label="Designation"
          required
          list="designation-suggestions"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          placeholder="e.g. Chairperson, Secretary, General Member"
        />
        <Input id="user-unit" label="Unit" required value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. B-304 or Gate 1" />
      </div>
      <datalist id="designation-suggestions">
        <option value="Chairperson" />
        <option value="Secretary" />
        <option value="Treasurer" />
        <option value="Committee Member" />
        <option value="General Member" />
        <option value="Security Supervisor" />
        <option value="Platform Administrator" />
      </datalist>

      <Input id="user-password" label="Password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Login password" />

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
