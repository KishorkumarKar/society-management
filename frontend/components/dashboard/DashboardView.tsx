"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { roleLabel, canAccessConsole, dashboardPathForRole } from "@/lib/data";
import { listAnnouncements } from "@/lib/api/announcements";
import { listUsers } from "@/lib/api/users";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import type { BackendAnnouncement, BackendUser } from "@/lib/api/types";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function DashboardView() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<BackendAnnouncement[] | null>(null);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);

  const [members, setMembers] = useState<BackendUser[] | null>(null);
  const [membersForbidden, setMembersForbidden] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || canAccessConsole(user.role)) return;

    let cancelled = false;

    listAnnouncements({ limit: 20, sort: "-created_at" })
      .then((result) => {
        if (!cancelled) setAnnouncements(result.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setAnnouncementsError(
          err instanceof ApiError || err instanceof ApiNetworkError
            ? err.message
            : "Couldn't load the noticeboard right now."
        );
      });

    listUsers({ limit: 50 })
      .then((result) => {
        if (!cancelled) setMembers(result.data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          // Not every role has `users.view` (e.g. Resident) — that's
          // expected, not a failure, so we just hide the section.
          setMembersForbidden(true);
        } else {
          setMembersError(
            err instanceof ApiError || err instanceof ApiNetworkError
              ? err.message
              : "Couldn't load the member directory right now."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!authLoading && user && canAccessConsole(user.role)) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return <Container className="py-24 text-center text-ink/50">Checking your session…</Container>;
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
    return <Container className="py-24 text-center text-ink/50">Redirecting to the admin console…</Container>;
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <Container className="flex flex-col gap-10 py-14">
      <div className="flex flex-col justify-between gap-6 border-b border-ink/10 pb-8 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-brass">
            {user.societyName}
          </span>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-ink/50">{roleLabel(user.role)}</p>
        </div>
        <Button
          variant="secondary"
          onClick={handleLogout}
          className="!text-ink !border-ink/20 hover:!border-rust hover:!text-rust"
        >
          Sign out
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col gap-2 p-6">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Society</span>
          <span className="font-display text-xl text-ink">{user.societyName}</span>
          <span className="text-sm text-ink/50">{user.societySlug}</span>
        </Card>
        <Card className="flex flex-col gap-2 p-6">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">Your access</span>
          <span className="font-display text-xl text-ink">{user.roles.join(", ") || roleLabel(user.role)}</span>
          <span className="text-sm text-ink/50">{user.permissions.length} permissions granted</span>
        </Card>
        <Card className="flex flex-col gap-2 p-6">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
            Registered members
          </span>
          <span className="font-display text-xl text-ink">
            {membersForbidden ? "—" : members ? `${members.length} people` : "…"}
          </span>
          <span className="text-sm text-ink/50">
            {membersForbidden ? "Not visible to your role" : "In this society"}
          </span>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <h2 className="font-display text-xl text-ink">Noticeboard</h2>
          <div className="flex flex-col gap-4">
            {announcementsError && (
              <Card className="p-6 text-sm text-rust">{announcementsError}</Card>
            )}
            {!announcementsError && announcements === null && (
              <Card className="p-6 text-sm text-ink/50">Loading the noticeboard…</Card>
            )}
            {announcements !== null && announcements.length === 0 && (
              <Card className="p-6 text-sm text-ink/50">
                Nothing pinned to this society&apos;s board yet.
              </Card>
            )}
            {announcements?.map((notice) => (
              <Card key={notice.id} className="flex flex-col gap-2 p-6">
                <div className="flex items-center justify-between gap-4">
                  <Badge tone="brass">{notice.priority}</Badge>
                  <span className="font-mono text-xs text-ink/40">
                    {formatDate(notice.sent_at ?? notice.created_at)}
                  </span>
                </div>
                <h3 className="font-display text-lg text-ink">{notice.title}</h3>
                <p className="text-sm leading-relaxed text-ink/60">{notice.body}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <h2 className="font-display text-xl text-ink">Member directory</h2>
          {membersForbidden ? (
            <Card className="p-6 text-sm text-ink/50">
              Your role doesn&apos;t have permission to view the member directory.
            </Card>
          ) : membersError ? (
            <Card className="p-6 text-sm text-rust">{membersError}</Card>
          ) : members === null ? (
            <Card className="p-6 text-sm text-ink/50">Loading members…</Card>
          ) : (
            <Card className="divide-y divide-ink/10 p-0">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-ink font-display text-xs text-brass">
                    {initialsFromName(member.name)}
                  </span>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-ink">{member.name}</span>
                    <span className="text-xs text-ink/50">{member.email || member.phone}</span>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}
