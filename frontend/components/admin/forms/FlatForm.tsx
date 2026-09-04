"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createFlat, updateFlat, type CreateFlatPayload } from "@/lib/api/flats";
import { listUsers } from "@/lib/api/users";
import type { BackendFlat, BackendUser } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface FlatFormProps {
  initial?: BackendFlat;
  onSaved: (flat: BackendFlat) => void;
  submitLabel: string;
}

export default function FlatForm({ initial, onSaved, submitLabel }: FlatFormProps) {
  const isEditing = !!initial;

  const [block, setBlock] = useState(initial?.block ?? "");
  const [floor, setFloor] = useState(initial?.floor ?? "");
  const [unitNo, setUnitNo] = useState(initial?.unit_no ?? "");
  const [ownerId, setOwnerId] = useState(initial?.owner_id ? String(initial.owner_id) : "");
  const [sqft, setSqft] = useState(String(initial?.sqft ?? 0));
  const [pricePerSqft, setPricePerSqft] = useState(
    initial?.price_per_sqft != null ? String(initial.price_per_sqft) : ""
  );
  const [fixPrice, setFixPrice] = useState(initial?.fix_price != null ? String(initial.fix_price) : "");

  const [owners, setOwners] = useState<BackendUser[] | null>(null);
  const [ownersError, setOwnersError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listUsers({ limit: 100 })
      .then((res) => setOwners(res.data))
      .catch((err) =>
        setOwnersError(
          err instanceof ApiError || err instanceof ApiNetworkError
            ? err.message
            : "Couldn't load users for the owner picker."
        )
      );
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!block.trim() || !floor.trim() || !unitNo.trim()) {
      setError("Block, floor and unit number are all required.");
      return;
    }

    const payload: CreateFlatPayload = {
      block: block.trim(),
      floor: floor.trim(),
      unitNo: unitNo.trim(),
      ownerId: ownerId ? Number(ownerId) : null,
      sqft: sqft ? Number(sqft) : 0,
      pricePerSqft: pricePerSqft ? Number(pricePerSqft) : null,
      fixPrice: fixPrice ? Number(fixPrice) : null,
    };

    setSubmitting(true);
    try {
      const saved = isEditing && initial ? await updateFlat(initial.id, payload) : await createFlat(payload);
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't save this flat. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Input id="flat-block" label="Block" required value={block} onChange={(e) => setBlock(e.target.value)} placeholder="e.g. B" />
        <Input id="flat-floor" label="Floor" required value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="e.g. 3" />
        <Input id="flat-unit" label="Unit No." required value={unitNo} onChange={(e) => setUnitNo(e.target.value)} placeholder="e.g. 304" />
      </div>

      <Select id="flat-owner" label="Owner (optional)" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} disabled={!owners}>
        <option value="">No owner assigned</option>
        {owners?.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.name} ({owner.email || owner.phone})
          </option>
        ))}
      </Select>
      {ownersError && <p className="-mt-3 text-xs text-rust">{ownersError}</p>}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Input id="flat-sqft" label="Area (sq. ft.)" type="number" min="0" value={sqft} onChange={(e) => setSqft(e.target.value)} />
        <Input
          id="flat-price-per-sqft"
          label="Price per sq. ft. (optional)"
          type="number"
          min="0"
          value={pricePerSqft}
          onChange={(e) => setPricePerSqft(e.target.value)}
        />
        <Input
          id="flat-fix-price"
          label="Fixed price (optional)"
          type="number"
          min="0"
          value={fixPrice}
          onChange={(e) => setFixPrice(e.target.value)}
        />
      </div>

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
