"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Building2,
  Users,
  Bell,
  LogOut,
  Shield,
  UserCog,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  List,
  Wallet,
  Receipt,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: ("super_admin" | "admin")[];
}

interface ParentNavItem {
  label: string;
  icon: React.ReactNode;
  roles: ("super_admin" | "admin")[];
  children: NavItem[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, isLoading, adminLogout } = useAuth();
  const isLoginPage = pathname === "/admin/login";

  // Track which parent menus are expanded
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    events: pathname.startsWith("/admin/events"),
  });

  useEffect(() => {
    if (!isLoading && !admin && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [isLoading, admin, isLoginPage, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-dark">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  if (isLoginPage) return <>{children}</>;
  if (!admin) return null;

  const isSuperAdmin = admin.role === "super_admin";

  const standaloneNav: NavItem[] = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      roles: ["super_admin", "admin"],
    },
    {
      href: "/admin/societies",
      label: "Societies",
      icon: <Building2 size={18} />,
      roles: ["super_admin"],
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: <Users size={18} />,
      roles: ["super_admin", "admin"],
    },
    {
      href: "/admin/notices",
      label: "Notices",
      icon: <Bell size={18} />,
      roles: ["super_admin", "admin"],
    },
  ];

  const parentNav: ParentNavItem[] = [
    {
      label: "Events",
      icon: <CalendarDays size={18} />,
      roles: ["super_admin", "admin"],
      children: [
        {
          href: "/admin/events",
          label: "All Events",
          icon: <List size={16} />,
          roles: ["super_admin", "admin"],
        },
        {
          href: "/admin/events/collections",
          label: "Collections",
          icon: <Wallet size={16} />,
          roles: ["super_admin", "admin"],
        },
        {
          href: "/admin/events/expenses",
          label: "Expenses",
          icon: <Receipt size={16} />,
          roles: ["super_admin", "admin"],
        },
      ],
    },
  ];

  const visibleStandalone = standaloneNav.filter((n) => n.roles.includes(admin.role));
  const visibleParents = parentNav.filter((p) => p.roles.includes(admin.role));

  function toggleMenu(label: string) {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  const isParentActive = (parent: ParentNavItem) =>
    parent.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));

  return (
    <div className="min-h-screen flex bg-ink-dark text-paper font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-ink flex flex-col border-r border-ink-light/30 shrink-0">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-ink-light/30">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Shield size={20} className="text-brass" />
            <span className="font-display text-lg italic text-paper">SocietyLedger</span>
          </Link>
          <p className="text-[10px] uppercase tracking-widest text-muted mt-1">Admin Console</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {/* Standalone items */}
          {visibleStandalone.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded transition-colors ${
                  active
                    ? "bg-brass/20 text-brass border-l-2 border-brass"
                    : "text-paper/70 hover:bg-ink-light/50 hover:text-paper"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}

          {/* Parent-child menus */}
          {visibleParents.map((parent) => {
            const parentActive = isParentActive(parent);
            const isExpanded = expandedMenus[parent.label] || parentActive;

            return (
              <div key={parent.label} className="mt-1">
                <button
                  onClick={() => toggleMenu(parent.label)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 text-sm rounded transition-colors ${
                    parentActive
                      ? "bg-brass/10 text-brass"
                      : "text-paper/70 hover:bg-ink-light/50 hover:text-paper"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {parent.icon}
                    {parent.label}
                  </span>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-ink-light/30 pl-2">
                    {parent.children.map((child) => {
                      const active = pathname === child.href || pathname.startsWith(child.href + "/");
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${
                            active
                              ? "bg-brass/20 text-brass border-l-2 border-brass"
                              : "text-paper/60 hover:bg-ink-light/50 hover:text-paper"
                          }`}
                        >
                          {child.icon}
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="px-4 py-4 border-t border-ink-light/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-brass/20 flex items-center justify-center">
              <UserCog size={14} className="text-brass" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium truncate">{admin.name}</div>
              <div className="text-[10px] text-muted uppercase tracking-wide">
                {isSuperAdmin ? "Super Admin" : "Society Admin"}
                {admin.societyName && ` · ${admin.societyName}`}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              adminLogout();
              router.push("/admin/login");
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs uppercase tracking-wide text-rust hover:bg-rust/10 rounded transition-colors"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-paper text-ink">
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}