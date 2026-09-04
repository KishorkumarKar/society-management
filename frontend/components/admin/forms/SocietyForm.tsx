"use client";

import { useState, type FormEvent } from "react";
import { createSociety, updateSociety, type CreateSocietyPayload } from "@/lib/api/societies";
import type { BackendSociety } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface SocietyFormProps {
  /** Present when editing — enables the `status` toggle and disables the
   *  (immutable, post-creation) slug field. */
  initial?: BackendSociety;
  onSaved: (society: BackendSociety) => void;
  submitLabel: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function SocietyForm({ initial, onSaved, submitLabel }: SocietyFormProps) {
  const isEditing = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [userLimit, setUserLimit] = useState(String(initial?.user_limit ?? 0));
  const [registrationNo, setRegistrationNo] = useState(initial?.registration_no ?? "");
  const [rateType, setRateType] = useState<"PER_SQFT" | "FIXED">(
    (initial?.rate_type as "PER_SQFT" | "FIXED") ?? "PER_SQFT"
  );
  const [ratePerSqft, setRatePerSqft] = useState(String(initial?.rate_per_sqft ?? 0));
  const [status, setStatus] = useState<0 | 1>((initial?.status as 0 | 1) ?? 1);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isEditing && !/^[a-z0-9-]+$/.test(slug)) {
      setError("Society login code can only contain lowercase letters, numbers and hyphens.");
      return;
    }

    setSubmitting(true);
    try {
      let saved: BackendSociety;
      if (isEditing && initial) {
        saved = await updateSociety(initial.id, {
          name,
          city,
          address,
          userLimit: Number(userLimit) || 0,
          registrationNo: registrationNo || null,
          rateType,
          ratePerSqft: Number(ratePerSqft) || 0,
          status,
        });
      } else {
        const payload: CreateSocietyPayload = {
          name,
          city,
          address,
          slug,
          userLimit: Number(userLimit) || 0,
          registrationNo: registrationNo || null,
          rateType,
          ratePerSqft: Number(ratePerSqft) || 0,
        };
        saved = await createSociety(payload);
      }
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't save this society. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          id="society-name"
          label="Society name"
          required
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
        />
        <Input id="society-city" label="City" required value={city} onChange={(e) => setCity(e.target.value)} />
      </div>

      <Input id="society-address" label="Address" required value={address} onChange={(e) => setAddress(e.target.value)} />

      <Input
        id="society-slug"
        label="Society login code (slug)"
        required
        value={slug}
        disabled={isEditing}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(slugify(e.target.value));
        }}
        placeholder="e.g. green-valley"
      />
      <p className="-mt-3 text-xs text-ink/40">
        {isEditing
          ? "The login code can't be changed after a society is created — every member's login depends on it."
          : "This is what every member of this society types into the \"Society login code\" field to sign in. Can't be changed later."}
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Select
          id="society-rate-type"
          label="Maintenance rate type"
          value={rateType}
          onChange={(e) => setRateType(e.target.value as "PER_SQFT" | "FIXED")}
        >
          <option value="PER_SQFT">Per sq. ft.</option>
          <option value="FIXED">Fixed</option>
        </Select>
        <Input
          id="society-rate"
          label={rateType === "PER_SQFT" ? "Rate per sq. ft." : "Fixed rate"}
          type="number"
          min="0"
          step="0.01"
          value={ratePerSqft}
          onChange={(e) => setRatePerSqft(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          id="society-user-limit"
          label="User limit (0 = unlimited)"
          type="number"
          min="0"
          value={userLimit}
          onChange={(e) => setUserLimit(e.target.value)}
        />
        <Input
          id="society-registration"
          label="Registration No."
          value={registrationNo ?? ""}
          onChange={(e) => setRegistrationNo(e.target.value)}
        />
      </div>

      {isEditing && (
        <Select id="society-status" label="Status" value={status} onChange={(e) => setStatus(Number(e.target.value) as 0 | 1)}>
          <option value={1}>Active</option>
          <option value={0}>Inactive</option>
        </Select>
      )}

      {error && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      <div>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
