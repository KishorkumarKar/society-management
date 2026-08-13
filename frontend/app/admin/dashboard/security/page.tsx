"use client";

import { UserCog, ShieldCheck, ScanFace, DoorOpen, CheckCircle2, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { securitySummary, guardsBySociety, shiftsBySociety, visitorsBySociety } from "@/lib/data";
import PageHeader from "@/components/admin/PageHeader";
import StatCard from "@/components/admin/StatCard";

/**
 * Only fetches aggregate counts (securitySummary), never full guard/shift/
 * visitor row data — keeps this landing page light regardless of how many
 * records exist underneath.
 */
export default function SecurityDashboardPage() {
  const { user } = useAuth();
  const { guards, shifts, visitors } = useData();

  if (!user) return null;

  const isSuperAdmin = user.role === "super-admin";
  const scopedGuards = isSuperAdmin ? guards : guardsBySociety(guards, user.societyId);
  const scopedShifts = isSuperAdmin ? shifts : shiftsBySociety(shifts, user.societyId);
  const scopedVisitors = isSuperAdmin ? visitors : visitorsBySociety(visitors, user.societyId);
  const summary = securitySummary(scopedGuards, scopedShifts, scopedVisitors);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Security"
        description={
          isSuperAdmin
            ? "Guards, shifts and visitor activity across every society on the network."
            : "Guards, shifts and visitor activity for your society, at a glance."
        }
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Security guards" value={summary.totalGuards.toString()} icon={UserCog} />
        <StatCard label="Guards on duty now" value={summary.guardsOnDuty.toString()} icon={ShieldCheck} />
        <StatCard label="Today's visitors" value={summary.todaysVisitors.toString()} icon={ScanFace} />
        <StatCard label="Currently inside" value={summary.visitorsInside.toString()} icon={DoorOpen} />
        <StatCard label="Today's completed visits" value={summary.todaysCompletedVisits.toString()} icon={CheckCircle2} />
        <StatCard label="Scheduled shifts" value={summary.scheduledShifts.toString()} icon={Clock} />
      </div>
    </div>
  );
}
