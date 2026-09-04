"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  IdCard,
  Bell,
  Building2,
  Home,
  ArrowLeftCircle,
  CalendarDays,
  ListChecks,
  Wallet,
  Receipt,
  Shield,
  UserCog,
  Clock,
  ScanFace,
  DoorOpen,
  KeyRound,
  Landmark,
  ChevronDown,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

type IconType = typeof LayoutDashboard;

interface NavLeaf {
  href: string;
  label: string;
  icon: IconType;
  roles: UserRole[];
}

interface NavGroup {
  label: string;
  icon: IconType;
  roles: UserRole[];
  children: NavLeaf[];
}

type NavEntry = NavLeaf | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

const NAV_ITEMS: NavEntry[] = [
  {
    href: "/admin/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["admin", "super-admin", "resident"],
  },
  {
    href: "/admin/dashboard/notifications",
    label: "Notifications",
    icon: Bell,
    roles: ["admin", "super-admin", "resident", "security"],
  },
  {
    href: "/admin/dashboard/users",
    label: "Users",
    icon: Users,
    roles: ["admin", "super-admin"],
  },
  {
    href: "/admin/dashboard/flats",
    label: "Flats",
    icon: Home,
    roles: ["admin", "super-admin"],
  },
  {
    href: "/admin/dashboard/members",
    label: "Members",
    icon: IdCard,
    roles: ["resident"],
  },
  {
    href: "/admin/dashboard/notices",
    label: "Notices",
    icon: Bell,
    roles: ["admin", "super-admin"],
  },
  {
    label: "Events",
    icon: CalendarDays,
    roles: ["admin", "super-admin", "resident"],
    children: [
      {
        href: "/admin/dashboard/events",
        label: "All Events",
        icon: ListChecks,
        roles: ["admin", "super-admin", "resident"],
      },
      {
        href: "/admin/dashboard/events/collections",
        label: "Collections",
        icon: Wallet,
        roles: ["admin", "super-admin"],
      },
      {
        href: "/admin/dashboard/events/expenses",
        label: "Expenses",
        icon: Receipt,
        roles: ["admin", "super-admin"],
      },
    ],
  },
  {
    href: "/admin/dashboard/hall-bookings",
    label: "Hall Bookings",
    icon: DoorOpen,
    roles: ["admin", "super-admin", "resident"],
  },
  {
    href: "/admin/dashboard/maintenance",
    label: "Maintenance",
    icon: Landmark,
    roles: ["admin", "super-admin"],
  },
  {
    href: "/admin/dashboard/expenses",
    label: "Expenses",
    icon: Receipt,
    roles: ["admin", "super-admin"],
  },
  {
    href: "/admin/dashboard/societies",
    label: "Societies",
    icon: Building2,
    roles: ["super-admin"],
  },
  {
    label: "Security",
    icon: Shield,
    roles: ["admin", "super-admin", "security"],
    children: [
      {
        href: "/admin/dashboard/security",
        label: "Dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "super-admin", "security"],
      },
      {
        href: "/admin/dashboard/security/guards",
        label: "Guards",
        icon: UserCog,
        roles: ["admin", "super-admin"],
      },
      {
        href: "/admin/dashboard/security/shifts",
        label: "Shifts",
        icon: Clock,
        roles: ["admin", "super-admin"],
      },
      {
        href: "/admin/dashboard/security/visitors",
        label: "Visitors",
        icon: ScanFace,
        roles: ["admin", "super-admin", "security"],
      },
    ],
  },
  {
    href: "/admin/dashboard/roles",
    label: "Roles",
    icon: KeyRound,
    roles: ["admin", "super-admin"],
  },
];

function NavLink({ item, pathname }: { item: NavLeaf; pathname: string | null }) {
  const active =
    pathname === item.href ||
    (item.href !== "/admin/dashboard" && pathname?.startsWith(item.href));
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
        active ? "bg-brass/15 text-brass" : "text-paper/60 hover:bg-paper/5 hover:text-paper"
      }`}
    >
      <Icon size={17} strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

function NavGroupItem({
  group,
  items,
  pathname,
}: {
  group: NavGroup;
  items: NavLeaf[];
  pathname: string | null;
}) {
  const groupHref = items[0]?.href.split("/").slice(0, -1).join("/") ?? "";
  const autoOpen =
    items.some((child) => pathname === child.href || pathname?.startsWith(child.href)) ||
    (groupHref !== "" && pathname?.startsWith(groupHref));
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? autoOpen;
  const Icon = group.icon;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setManualOpen(!open)}
        aria-expanded={open}
        className={`flex items-center justify-between rounded-sm px-3 py-2.5 text-sm transition-colors ${
          autoOpen ? "text-paper" : "text-paper/60 hover:bg-paper/5 hover:text-paper"
        }`}
      >
        <span className="flex items-center gap-3">
          <Icon size={17} strokeWidth={1.75} />
          {group.label}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={2}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-paper/10 pl-4">
          {items.map((child) => (
            <NavLink key={child.href} item={child} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminSidebar({
  role,
  className = "",
}: {
  role: UserRole;
  className?: string;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className={`w-64 shrink-0 flex-col bg-ink-dark ${className}`}>
      <div className="flex h-20 items-center gap-3 border-b border-paper/10 px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-brass/50 font-display text-sm text-brass">
          SM
        </span>
        <span className="font-display text-base text-paper">
          Society<span className="text-brass">Ledger</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-4 py-6">
        {items.map((item) => {
          if (!isGroup(item)) {
            return <NavLink key={item.href} item={item} pathname={pathname} />;
          }
          const visibleChildren = item.children.filter((child) => child.roles.includes(role));
          if (visibleChildren.length === 0) return null;
          return (
            <NavGroupItem key={item.label} group={item} items={visibleChildren} pathname={pathname} />
          );
        })}
      </nav>

      <div className="border-t border-paper/10 px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-paper/50 transition-colors hover:bg-paper/5 hover:text-paper"
        >
          <ArrowLeftCircle size={17} strokeWidth={1.75} />
          Back to public site
        </Link>
      </div>
    </aside>
  );
}
