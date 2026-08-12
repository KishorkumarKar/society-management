"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import type { SocietyEvent, EventStatus } from "@/lib/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

interface EventFormProps {
  initial?: SocietyEvent;
  submitLabel: string;
  onSubmit: (input: Omit<SocietyEvent, "id">) => void;
}

export default function EventForm({ initial, submitLabel, onSubmit }: EventFormProps) {
  const { user: currentUser } = useAuth();
  const { societies } = useData();
  const isSuperAdmin = currentUser?.role === "super-admin";

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [status, setStatus] = useState<EventStatus>(initial?.status ?? "upcoming");
  const [targetAmount, setTargetAmount] = useState(initial?.targetAmount?.toString() ?? "");
  const [societyId, setSocietyId] = useState(
    initial?.societyId ?? (isSuperAdmin ? "" : currentUser?.societyId ?? "")
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const finalSocietyId = isSuperAdmin ? societyId : currentUser?.societyId ?? "";
    if (!finalSocietyId) {
      setError("Choose a society for this event.");
      return;
    }
    if (!name.trim()) {
      setError("Event name is required.");
      return;
    }
    const target = Number(targetAmount);
    if (Number.isNaN(target) || target < 0) {
      setError("Target amount must be zero or more.");
      return;
    }

    onSubmit({
      name,
      description,
      date,
      status,
      targetAmount: target,
      societyId: finalSocietyId,
      createdBy: initial?.createdBy ?? currentUser?.id ?? "",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {isSuperAdmin ? (
        <Select
          id="event-society"
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
        <Input id="event-society-fixed" label="Society" value={currentUser?.societyName ?? ""} disabled />
      )}

      <Input
        id="event-name"
        label="Event name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Halloween Bash"
      />

      <Textarea
        id="event-description"
        label="Description"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What's this event about?"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Input id="event-date" label="Date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        <Select
          id="event-status"
          label="Status"
          required
          value={status}
          onChange={(e) => setStatus(e.target.value as EventStatus)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input
          id="event-target"
          label="Target amount (₹)"
          type="number"
          min="0"
          required
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
        />
      </div>

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
