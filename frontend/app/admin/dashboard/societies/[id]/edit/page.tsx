"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSociety, deleteSociety } from "@/lib/api/societies";
import type { BackendSociety } from "@/lib/api/types";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import RequireRole from "@/components/admin/RequireRole";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import SocietyForm from "@/components/admin/forms/SocietyForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function EditSocietyContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? Number(params.id) : NaN;
  const router = useRouter();

  const [society, setSociety] = useState<BackendSociety | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoadError("Invalid society id.");
      return;
    }
    getSociety(id)
      .then(setSociety)
      .catch((err) =>
        setLoadError(
          err instanceof ApiError || err instanceof ApiNetworkError
            ? err.message
            : "This society may have already been removed."
        )
      );
  }, [id]);

  async function handleDelete() {
    try {
      await deleteSociety(id);
      router.push("/admin/dashboard/societies");
    } catch (err) {
      setActionError(
        err instanceof ApiError || err instanceof ApiNetworkError
          ? err.message
          : "Couldn't delete this society."
      );
    }
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Society not found" description={loadError} />
        <Button
          href="/admin/dashboard/societies"
          variant="secondary"
          className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass"
        >
          Back to societies
        </Button>
      </div>
    );
  }

  if (!society) {
    return <div className="py-16 text-center text-ink/40">Loading…</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Edit ${society.name}`}
        description="Deleting a society also removes its users, flats and notices."
        action={<ConfirmDeleteButton label={society.name} onConfirm={handleDelete} />}
      />
      {actionError && (
        <p role="alert" className="rounded-sm border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust">
          {actionError}
        </p>
      )}
      <Card className="max-w-2xl p-8">
        <SocietyForm
          initial={society}
          submitLabel="Save changes"
          onSaved={() => router.push("/admin/dashboard/societies")}
        />
      </Card>
    </div>
  );
}

export default function EditSocietyPage() {
  return (
    <RequireRole roles={["super-admin"]}>
      <EditSocietyContent />
    </RequireRole>
  );
}
