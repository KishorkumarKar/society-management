import type { Metadata } from "next";
import DashboardView from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Dashboard — SocietyLedger",
  description: "Your society's noticeboard, ledger and member directory.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
