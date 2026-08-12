"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { collectionStatusTone, canManage } from "@/lib/data";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function ViewEventCollectionPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const collectionId = typeof params.collectionId === "string" ? params.collectionId : "";
  const { user } = useAuth();
  const { collections } = useData();
  const isManager = !!user && canManage(user.role);

  const collection = collections.find((c) => c.id === collectionId);

  if (!collection) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-ink/50">This collection entry may have already been removed.</p>
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
            <span className="font-display text-2xl text-ink">{collection.memberName}</span>
            <span className="text-sm text-ink/50">{collection.unit}</span>
          </div>
          <Badge tone={collectionStatusTone(collection.status)}>{collection.status}</Badge>
        </div>

        <dl className="grid grid-cols-2 gap-6 border-t border-ink/10 pt-6 text-sm">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Amount due</dt>
            <dd className="mt-1 text-ink">₹{collection.amountDue.toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Amount paid</dt>
            <dd className="mt-1 text-ink">₹{collection.amountPaid.toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Payment date</dt>
            <dd className="mt-1 text-ink">{collection.paymentDate || "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Balance</dt>
            <dd className="mt-1 text-ink">
              ₹{(collection.amountDue - collection.amountPaid).toLocaleString("en-IN")}
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
