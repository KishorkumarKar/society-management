"use client";

import { useAuth } from "@/context/AuthContext";
import { getAllSocieties, getAllUsers, getAllNotices } from "@/lib/data";
import { Building2, Users, Bell, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { admin } = useAuth();
  const isSuperAdmin = admin?.role === "super_admin";

  const societies = getAllSocieties();
  const allUsers = getAllUsers();
  const allNotices = getAllNotices();

  const stats = isSuperAdmin
    ? [
        { label: "Total Societies", value: societies.length, icon: <Building2 size={20} />, color: "bg-brass/10 text-brass" },
        { label: "Total Users", value: allUsers.length, icon: <Users size={20} />, color: "bg-sage/10 text-sage" },
        { label: "Total Notices", value: allNotices.length, icon: <Bell size={20} />, color: "bg-rust/10 text-rust" },
        { label: "Occupancy Rate", value: "87%", icon: <TrendingUp size={20} />, color: "bg-ink/10 text-ink" },
      ]
    : [
        { label: "Society Users", value: allUsers.filter((u) => u.societyId === admin?.societyId).length, icon: <Users size={20} />, color: "bg-sage/10 text-sage" },
        { label: "Notices", value: allNotices.filter((n) => n.societyId === admin?.societyId).length, icon: <Bell size={20} />, color: "bg-rust/10 text-rust" },
        { label: "Committee", value: allUsers.filter((u) => u.societyId === admin?.societyId && u.role === "committee").length, icon: <Users size={20} />, color: "bg-brass/10 text-brass" },
        { label: "Residents", value: allUsers.filter((u) => u.societyId === admin?.societyId && u.role === "resident").length, icon: <Users size={20} />, color: "bg-ink/10 text-ink" },
      ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl italic text-ink">Dashboard</h1>
        <p className="text-sm text-muted mt-1">
          Welcome back, {admin?.name}. Here is what is happening {isSuperAdmin ? "across all societies" : "in your society"}.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-paper-dim p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">{s.label}</p>
                <p className="text-2xl font-semibold text-ink mt-1">{s.value}</p>
              </div>
              <div className={`p-2.5 rounded ${s.color}`}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-paper-dim p-5">
          <h2 className="font-display text-lg italic text-ink mb-4">Recent Notices</h2>
          <div className="space-y-3">
            {allNotices.slice(0, 5).map((n) => (
              <div key={n.id} className="flex items-start gap-3 pb-3 border-b border-paper-dim last:border-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-brass mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  <p className="text-xs text-muted">{n.category} · {n.date}</p>
                </div>
              </div>
            ))}
            {allNotices.length === 0 && <p className="text-sm text-muted">No notices yet.</p>}
          </div>
        </div>

        <div className="bg-white border border-paper-dim p-5">
          <h2 className="font-display text-lg italic text-ink mb-4">Recent Users</h2>
          <div className="space-y-3">
            {allUsers.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center justify-between pb-3 border-b border-paper-dim last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-ink">{u.name}</p>
                  <p className="text-xs text-muted">{u.email} · {u.role}</p>
                </div>
                <span className="text-xs px-2 py-0.5 bg-ink/5 text-ink rounded">{u.unit}</span>
              </div>
            ))}
            {allUsers.length === 0 && <p className="text-sm text-muted">No users yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}