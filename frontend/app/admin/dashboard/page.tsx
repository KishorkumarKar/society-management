"use client";

import { Building2, Users, Bell, DoorOpen } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { findSocietyById, usersBySociety, noticesBySociety } from "@/lib/data";
import PageHeader from "@/components/admin/PageHeader";
import StatCard from "@/components/admin/StatCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const { societies, users, notices } = useData();

  if (!user) return null;

  const isSuperAdmin = user.role === "super-admin";

  if (isSuperAdmin) {
    const totalUnits = societies.reduce((sum, s) => sum + s.totalUnits, 0);
    const occupiedUnits = societies.reduce((sum, s) => sum + s.occupiedUnits, 0);
    const occupancy = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
    const recentNotices = [...notices]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5);

    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Platform overview"
          description="Every society on the network, at a glance."
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Societies" value={societies.length.toString()} icon={Building2} />
          <StatCard label="Registered users" value={users.length.toString()} icon={Users} />
          <StatCard label="Active notices" value={notices.length.toString()} icon={Bell} />
          <StatCard
            label="Occupancy"
            value={`${occupancy}%`}
            hint={`${occupiedUnits} / ${totalUnits} units`}
            icon={DoorOpen}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="flex flex-col gap-4 lg:col-span-3">
            <h2 className="font-display text-xl text-ink">Societies</h2>
            <Card className="divide-y divide-ink/10 p-0">
              {societies.map((society) => (
                <div key={society.id} className="flex items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-xs text-brass">
                      {society.initial}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-ink">{society.name}</span>
                      <span className="text-xs text-ink/50">{society.city}</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-ink/40">
                    {society.occupiedUnits}/{society.totalUnits} units
                  </span>
                </div>
              ))}
            </Card>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-2">
            <h2 className="font-display text-xl text-ink">Recent notices</h2>
            <Card className="divide-y divide-ink/10 p-0">
              {recentNotices.length === 0 && (
                <p className="p-5 text-sm text-ink/50">No notices yet.</p>
              )}
              {recentNotices.map((notice) => (
                <div key={notice.id} className="flex flex-col gap-1.5 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <Badge tone="brass">{notice.category}</Badge>
                    <span className="font-mono text-xs text-ink/40">{notice.date}</span>
                  </div>
                  <span className="text-sm text-ink">{notice.title}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const society = findSocietyById(societies, user.societyId);
  const members = usersBySociety(users, user.societyId);
  const noticeList = noticesBySociety(notices, user.societyId);
  const occupancy =
    society && society.totalUnits > 0
      ? Math.round((society.occupiedUnits / society.totalUnits) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={society?.name ?? "Your society"}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Units" value={`${society?.totalUnits ?? 0}`} icon={Building2} />
        <StatCard
          label="Occupied"
          value={`${occupancy}%`}
          hint={`${society?.occupiedUnits ?? 0} of ${society?.totalUnits ?? 0}`}
          icon={DoorOpen}
        />
        <StatCard label="Members" value={members.length.toString()} icon={Users} />
        <StatCard label="Notices" value={noticeList.length.toString()} icon={Bell} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <h2 className="font-display text-xl text-ink">Noticeboard</h2>
          <Card className="divide-y divide-ink/10 p-0">
            {noticeList.length === 0 && (
              <p className="p-5 text-sm text-ink/50">Nothing pinned yet.</p>
            )}
            {noticeList.map((notice) => (
              <div key={notice.id} className="flex flex-col gap-1.5 p-5">
                <div className="flex items-center justify-between gap-4">
                  <Badge tone="brass">{notice.category}</Badge>
                  <span className="font-mono text-xs text-ink/40">{notice.date}</span>
                </div>
                <span className="text-sm font-medium text-ink">{notice.title}</span>
                <p className="text-sm text-ink/60">{notice.body}</p>
              </div>
            ))}
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <h2 className="font-display text-xl text-ink">Members</h2>
          <Card className="divide-y divide-ink/10 p-0">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-xs text-brass">
                  {member.initial}
                </span>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium text-ink">{member.name}</span>
                  <span className="text-xs text-ink/50">{member.designation} · {member.unit}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
