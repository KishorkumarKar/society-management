"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import NoticeForm from "@/components/admin/forms/NoticeForm";
import Card from "@/components/ui/Card";
import RequireRole from "@/components/admin/RequireRole";

function NewNoticeContent() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Add notice" description="Pin something to the noticeboard." />
      <Card className="max-w-2xl p-8">
        <NoticeForm submitLabel="Create notice" onSaved={() => router.push("/admin/dashboard/notices")} />
      </Card>
    </div>
  );
}

export default function NewNoticePage() {
  return (
    <RequireRole roles={["admin", "super-admin"]}>
      <NewNoticeContent />
    </RequireRole>
  );
}
