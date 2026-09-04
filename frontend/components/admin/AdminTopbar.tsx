"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X, LogOut, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { roleLabel } from "@/lib/data";
import { listNotifications } from "@/lib/api/notifications";
import AdminSidebar from "@/components/admin/AdminSidebar";
import type { AuthenticatedUser } from "@/lib/types";

export default function AdminTopbar({ user }: { user: AuthenticatedUser }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);

  useEffect(() => {
    listNotifications({ isRead: false, limit: 1 })
      .then((res) => setUnreadCount(res.pagination.total))
      .catch(() => {
        // Not critical — the bell just shows no badge if this fails.
      });
  }, []);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-ink/10 bg-paper px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="text-ink lg:hidden"
          >
            <Menu size={22} />
          </button>
          <div className="flex flex-col">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
              {user.societyName}
            </span>
            <span className="font-display text-lg text-ink">Admin Console</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard/notifications"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-sm border border-ink/15 text-ink/60 transition-colors hover:border-brass hover:text-brass"
          >
            <Bell size={17} strokeWidth={1.75} />
            {!!unreadCount && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rust px-1 font-mono text-[10px] text-paper">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-medium text-ink">{user.name}</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-brass">
              {roleLabel(user.role)}
            </span>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-ink font-display text-sm text-brass">
            {user.initial}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-ink/15 text-ink/60 transition-colors hover:border-rust hover:text-rust"
          >
            <LogOut size={17} strokeWidth={1.75} />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64 bg-ink-dark">
            <div className="flex h-20 items-center justify-between border-b border-paper/10 px-6">
              <Link href="/admin/dashboard" className="font-display text-base text-paper">
                Society<span className="text-brass">Ledger</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="text-paper/70"
              >
                <X size={20} />
              </button>
            </div>
            <div onClick={() => setMobileOpen(false)}>
              <AdminSidebar role={user.role} className="flex border-r-0" />
            </div>
          </div>
          <div
            className="flex-1 bg-ink/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        </div>
      )}
    </>
  );
}
