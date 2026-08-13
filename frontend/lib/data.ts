import societiesData from "@/data/societies.json";
import usersData from "@/data/users.json";
import plansData from "@/data/plans.json";
import noticesData from "@/data/notices.json";
import eventsData from "@/data/events.json";
import collectionsData from "@/data/collections.json";
import expensesData from "@/data/expenses.json";
import aclData from "@/data/acl.json";
import guardsData from "@/data/security-guards.json";
import shiftsData from "@/data/security-shifts.json";
import visitorsData from "@/data/visitors.json";
import type {
  Society,
  SocietyUser,
  Plan,
  Notice,
  UserRole,
  SocietyEvent,
  EventCollection,
  EventExpense,
  EventStatus,
  CollectionStatus,
  AclRoleEntry,
  SecurityGuard,
  SecurityShift,
  Visitor,
  GuardStatus,
  ShiftStatus,
  ShiftType,
  VisitorStatus,
} from "@/lib/types";
import { PLATFORM_SCOPE } from "@/lib/types";

// Static snapshots. Server components (home, about, pricing) read these
// directly. Client components that need to reflect admin edits made during
// the session instead read the live arrays from DataContext and pass them
// into the pure helpers below.
export const societies = societiesData as Society[];
export const users = usersData as SocietyUser[];
export const plans = plansData as Plan[];
export const notices = noticesData as Notice[];
export const events = eventsData as SocietyEvent[];
export const collections = collectionsData as EventCollection[];
export const expenses = expensesData as EventExpense[];
export const guards = guardsData as SecurityGuard[];
export const shifts = shiftsData as SecurityShift[];
export const visitors = visitorsData as Visitor[];
/** Static for now — shaped to match a future `GET /api/acl` response. */
export const aclMatrix = aclData as AclRoleEntry[];

export function findSocietyById(list: Society[], id: string): Society | undefined {
  return list.find((s) => s.id === id);
}

export function findSocietyBySlug(list: Society[], slug: string): Society | undefined {
  return list.find((s) => s.slug === slug);
}

export function matchUser(
  list: SocietyUser[],
  societyId: string,
  identifier: string,
  password: string
): SocietyUser | undefined {
  const normalized = identifier.trim().toLowerCase();
  return list.find(
    (u) =>
      u.societyId === societyId &&
      u.password === password &&
      (u.email.toLowerCase() === normalized || u.phone === identifier.trim())
  );
}

export function usersBySociety(list: SocietyUser[], societyId: string): SocietyUser[] {
  return list.filter((u) => u.societyId === societyId);
}

export function noticesBySociety(list: Notice[], societyId: string): Notice[] {
  return list
    .filter((n) => n.societyId === societyId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "super-admin":
      return "Super Admin";
    case "admin":
      return "Society Admin";
    case "committee":
      return "Committee Member";
    case "resident":
      return "Resident";
    case "security":
      return "Security Desk";
  }
}

export function canManage(role: UserRole): boolean {
  return role === "admin" || role === "super-admin";
}

/** Anyone allowed inside the /admin console shell — full managers plus
 *  residents (read-only tabs) and security desk staff (visitor management). */
export function canAccessConsole(role: UserRole): boolean {
  return canManage(role) || role === "resident" || role === "security";
}

export function dashboardPathForRole(role: UserRole): string {
  return canAccessConsole(role) ? "/admin/dashboard" : "/dashboard";
}

export function societyDisplayName(
  list: Society[],
  societyId: string
): string {
  if (societyId === PLATFORM_SCOPE) return "All Societies (Platform)";
  return findSocietyById(list, societyId)?.name ?? "Unknown Society";
}

export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${rand}`;
}

export function eventsBySociety(list: SocietyEvent[], societyId: string): SocietyEvent[] {
  return list
    .filter((e) => e.societyId === societyId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function collectionsByEvent(
  list: EventCollection[],
  eventId: string
): EventCollection[] {
  return list.filter((c) => c.eventId === eventId);
}

export function expensesByEvent(list: EventExpense[], eventId: string): EventExpense[] {
  return list.filter((e) => e.eventId === eventId);
}

export interface EventTotals {
  collected: number;
  dueTotal: number;
  spent: number;
  balance: number;
  pendingCount: number;
}

export function eventTotals(
  eventId: string,
  collectionsList: EventCollection[],
  expensesList: EventExpense[]
): EventTotals {
  const eventCollections = collectionsByEvent(collectionsList, eventId);
  const eventExpenses = expensesByEvent(expensesList, eventId);
  const collected = eventCollections.reduce((sum, c) => sum + c.amountPaid, 0);
  const dueTotal = eventCollections.reduce((sum, c) => sum + c.amountDue, 0);
  const spent = eventExpenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingCount = eventCollections.filter((c) => c.status !== "paid").length;
  return { collected, dueTotal, spent, balance: collected - spent, pendingCount };
}

export function eventStatusTone(status: EventStatus): "brass" | "sage" | "muted" | "rust" {
  switch (status) {
    case "upcoming":
      return "brass";
    case "ongoing":
      return "sage";
    case "completed":
      return "muted";
    case "cancelled":
      return "rust";
  }
}

export function collectionStatusTone(status: CollectionStatus): "sage" | "brass" | "rust" {
  switch (status) {
    case "paid":
      return "sage";
    case "partial":
      return "brass";
    case "pending":
      return "rust";
  }
}

export function aclEntryForRole(list: AclRoleEntry[], role: UserRole): AclRoleEntry | undefined {
  return list.find((entry) => entry.role === role);
}

// ---------------------------------------------------------------------------
// Security: guards
// ---------------------------------------------------------------------------

export function guardsBySociety(list: SecurityGuard[], societyId: string): SecurityGuard[] {
  return list.filter((g) => g.societyId === societyId);
}

export function findGuardById(list: SecurityGuard[], id: string): SecurityGuard | undefined {
  return list.find((g) => g.id === id);
}

export function guardStatusTone(status: GuardStatus): "sage" | "muted" {
  return status === "active" ? "sage" : "muted";
}

// ---------------------------------------------------------------------------
// Security: shifts
// ---------------------------------------------------------------------------

/** Common shift presets a society can pick from, or CUSTOM for anything else. */
export const SHIFT_TYPE_PRESETS: {
  type: ShiftType;
  label: string;
  options: { label: string; startTime: string; endTime: string; durationHours: number }[];
}[] = [
  {
    type: "12H",
    label: "12 Hours",
    options: [
      { label: "6:00 AM – 6:00 PM", startTime: "06:00", endTime: "18:00", durationHours: 12 },
      { label: "6:00 PM – 6:00 AM", startTime: "18:00", endTime: "06:00", durationHours: 12 },
    ],
  },
  {
    type: "8H",
    label: "8 Hours",
    options: [
      { label: "6:00 AM – 2:00 PM", startTime: "06:00", endTime: "14:00", durationHours: 8 },
      { label: "2:00 PM – 10:00 PM", startTime: "14:00", endTime: "22:00", durationHours: 8 },
      { label: "10:00 PM – 6:00 AM", startTime: "22:00", endTime: "06:00", durationHours: 8 },
    ],
  },
  {
    type: "HALF_DAY",
    label: "Half Day",
    options: [
      { label: "6:00 AM – 12:00 PM", startTime: "06:00", endTime: "12:00", durationHours: 6 },
      { label: "12:00 PM – 6:00 PM", startTime: "12:00", endTime: "18:00", durationHours: 6 },
    ],
  },
  { type: "CUSTOM", label: "Custom", options: [] },
];

/** Duration in hours between two "HH:MM" times, handling overnight shifts
 *  (e.g. 18:00 → 06:00 spans midnight). */
export function computeDurationHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  const startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes <= startMinutes) endMinutes += 24 * 60;
  return Math.round(((endMinutes - startMinutes) / 60) * 100) / 100;
}

export function shiftsBySociety(list: SecurityShift[], societyId: string): SecurityShift[] {
  return list
    .filter((s) => s.societyId === societyId)
    .sort((a, b) => (a.shiftDate < b.shiftDate ? 1 : -1));
}

export function shiftStatusTone(status: ShiftStatus): "brass" | "sage" | "muted" | "rust" {
  switch (status) {
    case "scheduled":
      return "brass";
    case "active":
      return "sage";
    case "completed":
      return "muted";
    case "cancelled":
      return "rust";
  }
}

// ---------------------------------------------------------------------------
// Security: visitors
// ---------------------------------------------------------------------------

export const VISITOR_TYPES = [
  "Guest",
  "Delivery",
  "Cab/Taxi",
  "Service Provider",
  "Domestic Help",
  "Vendor",
  "Other",
] as const;

export function visitorsBySociety(list: Visitor[], societyId: string): Visitor[] {
  return list
    .filter((v) => v.societyId === societyId)
    .sort((a, b) => {
      const aKey = `${a.inDate} ${a.inTime}`;
      const bKey = `${b.inDate} ${b.inTime}`;
      return aKey < bKey ? 1 : -1;
    });
}

export function visitorStatusTone(status: VisitorStatus): "sage" | "brass" {
  return status === "in" ? "brass" : "sage";
}

/** "YYYY-MM-DD" for the browser's current date — used by the Today's
 *  Visitors quick filter and the Security Dashboard cards. */
export function todayISODate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "HH:MM" for the browser's current time — used to default a new
 *  visitor's in-time and to stamp the out-time on Mark Out. */
export function nowHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export interface SecuritySummary {
  totalGuards: number;
  guardsOnDuty: number;
  todaysVisitors: number;
  visitorsInside: number;
  todaysCompletedVisits: number;
  scheduledShifts: number;
}

/** Powers the Security Dashboard's summary cards with a single pass over
 *  each list — the dashboard never fetches or renders full visitor/shift
 *  row data, only these counts. Pass already-scoped lists in: a society
 *  admin's own guards/shifts/visitors, or the full platform lists for a
 *  super-admin's cross-society view. */
export function securitySummary(
  guardsList: SecurityGuard[],
  shiftsList: SecurityShift[],
  visitorsList: Visitor[]
): SecuritySummary {
  const today = todayISODate();

  return {
    totalGuards: guardsList.length,
    guardsOnDuty: shiftsList.filter((s) => s.shiftDate === today && s.status === "active").length,
    todaysVisitors: visitorsList.filter((v) => v.inDate === today).length,
    visitorsInside: visitorsList.filter((v) => v.status === "in").length,
    todaysCompletedVisits: visitorsList.filter((v) => v.inDate === today && v.status === "out").length,
    scheduledShifts: shiftsList.filter((s) => s.status === "scheduled").length,
  };
}
