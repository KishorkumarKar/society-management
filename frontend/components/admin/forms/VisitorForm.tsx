"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { usersBySociety, todayISODate, nowHHMM, VISITOR_TYPES } from "@/lib/data";
import type { Visitor, VisitorType } from "@/lib/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

interface VisitorFormProps {
  initial?: Visitor;
  submitLabel: string;
  onSubmit: (input: Omit<Visitor, "id">) => void;
}

/** Visitor entry flow: pick the flat, name the visitor, capture contact +
 *  vehicle + purpose, and record how many people are with them. In-date/time
 *  default to now and the record is saved with status "in" — marking a
 *  visitor out is a separate action from the list/detail views, not this form. */
export default function VisitorForm({ initial, submitLabel, onSubmit }: VisitorFormProps) {
  const { user: currentUser } = useAuth();
  const { users } = useData();

  const societyId = currentUser?.societyId ?? "";
  const societyUnits = Array.from(new Set(usersBySociety(users, societyId).map((u) => u.unit))).sort();

  const [flatId, setFlatId] = useState(initial?.flatId ?? "");
  const [visitorName, setVisitorName] = useState(initial?.visitorName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [vehicleNumber, setVehicleNumber] = useState(initial?.vehicleNumber ?? "");
  const [visitorType, setVisitorType] = useState<VisitorType>(initial?.visitorType ?? "Guest");
  const [purpose, setPurpose] = useState(initial?.purpose ?? "");
  const [numberOfPersons, setNumberOfPersons] = useState(initial?.numberOfPersons?.toString() ?? "1");
  const [remarks, setRemarks] = useState(initial?.remarks ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!flatId.trim()) {
      setError("Enter or select the flat/unit being visited.");
      return;
    }
    if (!visitorName.trim()) {
      setError("Visitor name is required.");
      return;
    }
    const persons = Number(numberOfPersons);
    if (Number.isNaN(persons) || persons < 1) {
      setError("Number of persons must be at least 1.");
      return;
    }

    onSubmit({
      societyId,
      flatId,
      visitorName,
      phone,
      vehicleNumber,
      visitorType,
      purpose,
      numberOfPersons: persons,
      inDate: initial?.inDate ?? todayISODate(),
      inTime: initial?.inTime ?? nowHHMM(),
      outDate: initial?.outDate ?? "",
      outTime: initial?.outTime ?? "",
      status: initial?.status ?? "in",
      remarks,
      createdBy: initial?.createdBy ?? currentUser?.id ?? "",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="visitor-flat" className="font-mono text-xs uppercase tracking-wider text-ink/60">
          Flat / Unit
        </label>
        <input
          id="visitor-flat"
          list="visitor-flat-suggestions"
          required
          value={flatId}
          onChange={(e) => setFlatId(e.target.value)}
          placeholder="e.g. B-304"
          className="rounded-sm border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        />
        <datalist id="visitor-flat-suggestions">
          {societyUnits.map((unit) => (
            <option key={unit} value={unit} />
          ))}
        </datalist>
      </div>

      <Input id="visitor-name" label="Visitor name" required value={visitorName} onChange={(e) => setVisitorName(e.target.value)} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input id="visitor-phone" label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input id="visitor-vehicle" label="Vehicle number" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="If applicable" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Select id="visitor-type" label="Visitor type" required value={visitorType} onChange={(e) => setVisitorType(e.target.value as VisitorType)}>
          {VISITOR_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
        <Input
          id="visitor-persons"
          label="Number of persons"
          type="number"
          min="1"
          required
          value={numberOfPersons}
          onChange={(e) => setNumberOfPersons(e.target.value)}
        />
      </div>

      <Input id="visitor-purpose" label="Purpose of visit" value={purpose} onChange={(e) => setPurpose(e.target.value)} />

      <Textarea id="visitor-remarks" label="Remarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" />

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
