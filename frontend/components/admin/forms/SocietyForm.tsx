"use client";

import { useState, type FormEvent } from "react";
import type { Society } from "@/lib/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface SocietyFormProps {
  initial?: Society;
  onSubmit: (input: Omit<Society, "id">) => void;
  submitLabel: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function SocietyForm({ initial, onSubmit, submitLabel }: SocietyFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [established, setEstablished] = useState(
    initial?.established?.toString() ?? new Date().getFullYear().toString()
  );
  const [totalUnits, setTotalUnits] = useState(initial?.totalUnits?.toString() ?? "");
  const [occupiedUnits, setOccupiedUnits] = useState(initial?.occupiedUnits?.toString() ?? "");
  const [registrationNo, setRegistrationNo] = useState(initial?.registrationNo ?? "");
  const [error, setError] = useState<string | null>(null);

  function initialsOf(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "SO";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const total = Number(totalUnits);
    const occupied = Number(occupiedUnits);
    const year = Number(established);

    if (!name.trim()) {
      setError("Society name is required.");
      return;
    }
    if (Number.isNaN(total) || total <= 0) {
      setError("Total units must be a positive number.");
      return;
    }
    if (Number.isNaN(occupied) || occupied < 0 || occupied > total) {
      setError("Occupied units must be between 0 and total units.");
      return;
    }

    onSubmit({
      name,
      slug: initial?.slug ?? slugify(name),
      city,
      address,
      established: Number.isNaN(year) ? new Date().getFullYear() : year,
      totalUnits: total,
      occupiedUnits: occupied,
      initial: initial?.initial ?? initialsOf(name),
      registrationNo,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input id="society-name" label="Society name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input id="society-city" label="City" required value={city} onChange={(e) => setCity(e.target.value)} />
      </div>

      <Input id="society-address" label="Address" required value={address} onChange={(e) => setAddress(e.target.value)} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Input id="society-established" label="Established year" type="number" required value={established} onChange={(e) => setEstablished(e.target.value)} />
        <Input id="society-total-units" label="Total units" type="number" required value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} />
        <Input id="society-occupied-units" label="Occupied units" type="number" required value={occupiedUnits} onChange={(e) => setOccupiedUnits(e.target.value)} />
      </div>

      <Input id="society-registration" label="Registration No." required value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} />

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
