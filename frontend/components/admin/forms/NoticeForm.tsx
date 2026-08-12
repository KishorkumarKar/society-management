"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import type { Notice } from "@/lib/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const CATEGORIES = ["Maintenance", "Event", "Governance", "Security", "General"];

interface NoticeFormProps {
  initial?: Notice;
  onSubmit: (input: Omit<Notice, "id">) => void;
  submitLabel: string;
}

export default function NoticeForm({ initial, onSubmit, submitLabel }: NoticeFormProps) {
  const { user: currentUser } = useAuth();
  const { societies } = useData();
  const isSuperAdmin = currentUser?.role === "super-admin";

  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [date, setDate] = useState(initial?.date ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [societyId, setSocietyId] = useState(
    initial?.societyId ?? (isSuperAdmin ? "" : currentUser?.societyId ?? "")
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const finalSocietyId = isSuperAdmin ? societyId : currentUser?.societyId ?? "";
    if (!finalSocietyId) {
      setError("Choose a society for this notice.");
      return;
    }

    onSubmit({ title, category, date, body, societyId: finalSocietyId });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {isSuperAdmin ? (
        <Select
          id="notice-society"
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
        <Input id="notice-society-fixed" label="Society" value={currentUser?.societyName ?? ""} disabled />
      )}

      <Input id="notice-title" label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Select id="notice-category" label="Category" required value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Input id="notice-date" label="Date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <Textarea id="notice-body" label="Notice text" required rows={5} value={body} onChange={(e) => setBody(e.target.value)} />

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
