"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { SHIFT_TYPE_PRESETS, computeDurationHours, guardsBySociety } from "@/lib/data";
import type { SecurityShift, ShiftType, ShiftStatus } from "@/lib/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const STATUS_OPTIONS: { value: ShiftStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

interface ShiftFormProps {
  initial?: SecurityShift;
  submitLabel: string;
  onSubmit: (input: Omit<SecurityShift, "id">) => void;
}

export default function ShiftForm({ initial, submitLabel, onSubmit }: ShiftFormProps) {
  const { user: currentUser } = useAuth();
  const { societies, guards } = useData();
  const isSuperAdmin = currentUser?.role === "super-admin";

  const [societyId, setSocietyId] = useState(
    initial?.societyId ?? (isSuperAdmin ? "" : currentUser?.societyId ?? "")
  );
  const [shiftName, setShiftName] = useState(initial?.shiftName ?? "");
  const [shiftType, setShiftType] = useState<ShiftType>(initial?.shiftType ?? "12H");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "06:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "18:00");
  const [guardId, setGuardId] = useState(initial?.guardId ?? "");
  const [shiftDate, setShiftDate] = useState(initial?.shiftDate ?? "");
  const [status, setStatus] = useState<ShiftStatus>(initial?.status ?? "scheduled");
  const [remarks, setRemarks] = useState(initial?.remarks ?? "");
  const [error, setError] = useState<string | null>(null);

  const finalSocietyId = isSuperAdmin ? societyId : currentUser?.societyId ?? "";
  const availableGuards = guardsBySociety(guards, finalSocietyId);
  const preset = SHIFT_TYPE_PRESETS.find((p) => p.type === shiftType);
  const durationHours = computeDurationHours(startTime, endTime);

  function applyPresetOption(presetStart: string, presetEnd: string) {
    setStartTime(presetStart);
    setEndTime(presetEnd);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!finalSocietyId) {
      setError("Choose a society for this shift.");
      return;
    }
    if (!shiftName.trim()) {
      setError("Shift name is required.");
      return;
    }
    if (!guardId) {
      setError("Assign a guard to this shift.");
      return;
    }
    if (!shiftDate) {
      setError("Shift date is required.");
      return;
    }

    onSubmit({
      societyId: finalSocietyId,
      shiftName,
      shiftType,
      startTime,
      endTime,
      durationHours,
      guardId,
      shiftDate,
      status,
      remarks,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {isSuperAdmin ? (
        <Select
          id="shift-society"
          label="Society"
          required
          value={societyId}
          onChange={(e) => {
            setSocietyId(e.target.value);
            setGuardId("");
          }}
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
        <Input id="shift-society-fixed" label="Society" value={currentUser?.societyName ?? ""} disabled />
      )}

      <Input
        id="shift-name"
        label="Shift name"
        required
        value={shiftName}
        onChange={(e) => setShiftName(e.target.value)}
        placeholder="e.g. Day Shift, Night Shift"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Select
          id="shift-type"
          label="Shift type"
          required
          value={shiftType}
          onChange={(e) => setShiftType(e.target.value as ShiftType)}
        >
          {SHIFT_TYPE_PRESETS.map((p) => (
            <option key={p.type} value={p.type}>
              {p.label}
            </option>
          ))}
        </Select>
        <Select
          id="shift-guard"
          label="Assigned guard"
          required
          value={guardId}
          onChange={(e) => setGuardId(e.target.value)}
          disabled={!finalSocietyId}
        >
          <option value="" disabled>
            {finalSocietyId ? "Select a guard" : "Choose a society first"}
          </option>
          {availableGuards.map((guard) => (
            <option key={guard.id} value={guard.id}>
              {guard.name} ({guard.employeeCode})
            </option>
          ))}
        </Select>
      </div>

      {preset && preset.options.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wider text-ink/60">Preset time range</span>
          <div className="flex flex-wrap gap-2">
            {preset.options.map((option) => {
              const active = option.startTime === startTime && option.endTime === endTime;
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => applyPresetOption(option.startTime, option.endTime)}
                  className={`rounded-sm border px-3 py-2 text-sm transition-colors ${
                    active
                      ? "border-brass bg-brass/10 text-brass"
                      : "border-ink/15 text-ink/60 hover:border-brass/40 hover:text-ink"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Input
          id="shift-start"
          label="Start time"
          type="time"
          required
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
        <Input
          id="shift-end"
          label="End time"
          type="time"
          required
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
        <Input id="shift-duration" label="Duration (hours)" value={durationHours.toString()} disabled />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input id="shift-date" label="Shift date" type="date" required value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} />
        <Select id="shift-status" label="Status" required value={status} onChange={(e) => setStatus(e.target.value as ShiftStatus)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <Textarea id="shift-remarks" label="Remarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" />

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
