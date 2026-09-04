"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * This page used to render a role×module permission grid seeded from
 * mock data/acl.json — a fixed 5-role × 10-module matrix that never
 * mapped onto the real backend (dynamic per-society roles with granular
 * resource.action permissions, no such role/module shape or endpoint
 * exists). The live equivalent is the Roles page's permissions panel
 * (real roles, real permissions, actually persisted via
 * POST/DELETE /roles/:id/permissions/:permissionId) — redirect old links
 * there instead of 404ing or showing a grid that does nothing.
 */
export default function AclRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard/roles");
  }, [router]);

  return <div className="py-16 text-center text-ink/40">Access control has moved to Roles — redirecting…</div>;
}
