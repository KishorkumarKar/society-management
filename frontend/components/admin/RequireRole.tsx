"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/lib/types";

/**
 * Extra gate for pages within /admin that only a subset of admin roles
 * should reach (e.g. Societies management is super-admin only).
 */
export default function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[];
  children: ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const allowed = !!user && roles.includes(user.role);

  useEffect(() => {
    if (!isLoading && !allowed) {
      router.replace("/admin/dashboard");
    }
  }, [isLoading, allowed, router]);

  if (isLoading || !allowed) {
    return <p className="py-8 text-sm text-ink/50">Checking access…</p>;
  }

  return <>{children}</>;
}
