"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFlat, deleteFlat } from "@/lib/api/flats";
import type { BackendFlat } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import FlatForm from "@/components/admin/forms/FlatForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function EditFlatContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? Number(params.id) : NaN;
  const router = useRouter();

  const [flat, setFlat] = useState<BackendFlat | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid flat id.");
      return;
    }
    getFlat(id)
      .then(setFlat)
      .catch((err) =>
        setLoadError(
          err instanceof ApiError || err instanceof ApiNetworkError
            ? err.message
            : "This flat may have already been removed."
        )
      );
  }, [id]);

  async function handleDelete() {
    try {
      await deleteFlat(id);
      router.push("/admin/dashboard/flats");
    } catch (err) {
      setActionError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't delete this flat."
      );
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Flat not found" description={loadError} />
        <Button
          href="/admin/dashboard/flats"
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to flats
        </Button>
      </div>
    );
  }

  if (!flat) {
    return <div className="py-16 text-center text-ink/40">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Edit ${flat.block} · ${flat.unit_no}`}
        description="Update this unit's details, owner, or pricing."
        action={<ConfirmDeleteButton label={`${flat.block} ${flat.unit_no}`} onConfirm={handleDelete} />}
      />
      {actionError && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {actionError}
        </p>
      )}
      <Card className="max-w-2xl p-8">
        <FlatForm
          initial={flat}
          submitLabel="Save changes"
          onSaved={() => router.push("/admin/dashboard/flats")}
        />
      </Card>
    </div>
  );
}

export default function EditFlatPage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <EditFlatContent />
    </RequireRole>
  );
}
