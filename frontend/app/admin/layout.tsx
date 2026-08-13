import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminGuard from "@/components/admin/AdminGuard";

export const metadata: Metadata = {
  title: "Admin Console — SocietyLedger",
  description: "Manage societies, users and notices.",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
