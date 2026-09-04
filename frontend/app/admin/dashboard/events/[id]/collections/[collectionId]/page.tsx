"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { canManage } from "@/lib/data";
import { getEventCollection } from "@/lib/api/eventCollections";
import type { BackendEventCollection } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

function statusTone(status: BackendEventCollection["status"]): "sage" | "brass" | "rust" | "muted" {
  switch (status) {
    case "paid":
      return "sage";
    case "partial":
      return "brass";
    case "pending":
      return "rust";
    default:
      return "muted";
  }
}

export default function ViewEventCollectionPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const collectionId = typeof params.collectionId === "string" ? Number(params.collectionId) : NaN;
  const { user } = useAuth();
  const isManager = !!user && canManage(user.role);

  const [collection, setCollection] = useState<BackendEventCollection | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(collectionId)) return;
    getEventCollection(collectionId)
      .then(setCollection)
      .catch((err) =>
        setLoadError(
          err instanceof ApiError || err instanceof ApiNetworkError
            ? err.message
            : "This collection entry may have already been removed."
        )
      );
  }, [collectionId]);

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-ink/50">{loadError}</p>
        <Button
          href={`/admin/dashboard/events/${id}/collections`}
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to collections
        </Button>
      </div>
    );
  }

  if (!collection) {
    return <div className="py-16 text-center text-ink/40">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/dashboard/events/${id}/collections`}
          className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink/50 transition-colors hover:text-brass"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back to collections
        </Link>
        {isManager && (
          <Button
            href={`/admin/dashboard/events/${id}/collections/${collection.id}/edit`}
            variant="secondary"
            className="!border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
          >
            <Pencil size={15} strokeWidth={1.75} />
            Edit
          </Button>
        )}
      </div>

      <Card className="flex max-w-2xl flex-col gap-6 p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-display text-2xl text-ink">{collection.member_name}</span>
            <span className="text-sm text-ink/50">{collection.unit}</span>
          </div>
          <Badge tone={statusTone(collection.status)}>{collection.status}</Badge>
        </div>

        <dl className="grid grid-cols-2 gap-6 border-t border-ink/10 pt-6 text-sm">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Amount due</dt>
            <dd className="mt-1 text-ink">₹{Number(collection.amount_due).toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Amount paid</dt>
            <dd className="mt-1 text-ink">₹{Number(collection.amount_paid).toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Payment date</dt>
            <dd className="mt-1 text-ink">{collection.payment_date || "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Balance</dt>
            <dd className="mt-1 text-ink">
              ₹{(Number(collection.amount_due) - Number(collection.amount_paid)).toLocaleString("en-IN")}
            </dd>
          </div>
        </dl>

        {collection.notes && (
          <div className="border-t border-ink/10 pt-6">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Notes</dt>
            <dd className="mt-2 text-sm leading-relaxed text-ink/70">{collection.notes}</dd>
          </div>
        )}
      </Card>
    </div>
  );
}
