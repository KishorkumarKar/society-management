"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canAccessConsole } from "@/lib/data";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

/**
 * Gates the whole /admin section to signed-in admin / super-admin / resident
 * users and renders the persistent sidebar + topbar shell around the page
 * content. Individual pages further restrict by role via RequireRole and by
 * hiding create/edit/delete controls for read-only roles like resident.
 */
export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const authorized = !!user && canAccessConsole(user.role);

  useEffect(() => {
    if (!isLoading && !authorized) {
      router.replace("/login");
    }
  }, [isLoading, authorized, router]);

  if (isLoading || !authorized || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-ink/50">Checking your access…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <AdminSidebar role={user.role} className="hidden border-r border-paper/10 lg:flex" />
      <div className="flex min-h-screen flex-1 flex-col">
        <AdminTopbar user={user} />
        <main className="flex-1 px-6 py-8 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
