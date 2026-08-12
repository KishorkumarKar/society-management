"use client";

import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";
import NoticeForm from "@/components/admin/forms/NoticeForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import RequireRole from "@/components/admin/RequireRole";

function EditNoticeContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { notices, updateNotice, deleteNotice } = useData();

  const existing = notices.find((n) => n.id === id);

  if (!existing) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Notice not found" description="This notice may have already been removed." />
        <Button href="/admin/dashboard/notices" variant="secondary" className="w-fit !border-ink/20 !text-ink hover:!border-brass hover:!text-brass">
          Back to notices
        </Button>
      </div>
    );
  }

  function handleDelete() {
    deleteNotice(existing!.id);
    router.push("/admin/dashboard/notices");
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Edit notice"
        description={existing.title}
        action={<ConfirmDeleteButton label={existing.title} onConfirm={handleDelete} />}
      />
      <Card className="max-w-2xl p-8">
        <NoticeForm
          initial={existing}
          submitLabel="Save changes"
          onSubmit={(input) => {
            updateNotice(existing.id, input);
            router.push("/admin/dashboard/notices");
          }}
        />
      </Card>
    </div>
  );
}

export default function EditNoticePage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <EditNoticeContent />
    </RequireRole>
  );
}
