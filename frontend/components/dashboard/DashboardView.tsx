"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { findSocietyById, usersBySociety, noticesBySociety, roleLabel, canAccessConsole, dashboardPathForRole } from "@/lib/data";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function DashboardView() {
  const { user, logout, isLoading } = useAuth();
  const { societies, users, notices } = useData();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && canAccessConsole(user.role)) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <Container className="py-24 text-center text-ink/50">
        Checking your session…
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="flex flex-col items-center gap-6 py-24 text-center">
        <p className="text-ink/60">You need to sign in to view your dashboard.</p>
        <Button href="/login" variant="primary">
          Go to login
        </Button>
      </Container>
    );
  }

  if (canAccessConsole(user.role)) {
    return (
      <Container className="py-24 text-center text-ink/50">
        Redirecting to the admin console…
      </Container>
    );
  }

  const society = findSocietyById(societies, user.societyId);
  const members = usersBySociety(users, user.societyId);
  const noticeList = noticesBySociety(notices, user.societyId);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <Container className="flex flex-col gap-10 py-14">
      <div className="flex flex-col justify-between gap-6 border-b border-ink/10 pb-8 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-brass">
            {society?.name}
          </span>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-ink/50">
            {roleLabel(user.role)} · Unit {user.unit}
          </p>
        </div>
        <Button variant="secondary" onClick={handleLogout} className="!text-ink !border-ink/20 hover:!border-rust hover:!text-rust">
          Sign out
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col gap-2 p-6">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
            Society
          </span>
          <span className="font-display text-xl text-ink">{society?.name}</span>
          <span className="text-sm text-ink/50">{society?.address}</span>
        </Card>
        <Card className="flex flex-col gap-2 p-6">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
            Units
          </span>
          <span className="font-display text-xl text-ink">
            {society?.occupiedUnits} / {society?.totalUnits} occupied
          </span>
          <span className="text-sm text-ink/50">Registration {society?.registrationNo}</span>
        </Card>
        <Card className="flex flex-col gap-2 p-6">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
            Registered members
          </span>
          <span className="font-display text-xl text-ink">{members.length} people</span>
          <span className="text-sm text-ink/50">Across all roles</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <h2 className="font-display text-xl text-ink">Noticeboard</h2>
          <div className="flex flex-col gap-4">
            {noticeList.length === 0 && (
              <Card className="p-6 text-sm text-ink/50">
                Nothing pinned to this society&apos;s board yet.
              </Card>
            )}
            {noticeList.map((notice) => (
              <Card key={notice.id} className="flex flex-col gap-2 p-6">
                <div className="flex items-center justify-between gap-4">
                  <Badge tone="brass">{notice.category}</Badge>
                  <span className="font-mono text-xs text-ink/40">{notice.date}</span>
                </div>
                <h3 className="font-display text-lg text-ink">{notice.title}</h3>
                <p className="text-sm leading-relaxed text-ink/60">{notice.body}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <h2 className="font-display text-xl text-ink">Member directory</h2>
          <Card className="divide-y divide-ink/10 p-0">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-xs text-brass">
                  {member.initial}
                </span>
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-medium text-ink">{member.name}</span>
                  <span className="text-xs text-ink/50">
                    {member.designation} · {member.unit}
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </Container>
  );
}
