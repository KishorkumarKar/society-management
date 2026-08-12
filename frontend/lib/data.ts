import societiesData from "@/data/societies.json";
import usersData from "@/data/users.json";
import plansData from "@/data/plans.json";
import noticesData from "@/data/notices.json";
import eventsData from "@/data/events.json";
import collectionsData from "@/data/collections.json";
import expensesData from "@/data/expenses.json";
import aclData from "@/data/acl.json";
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
 *  residents, who get read-only tabs (Overview, Members, view-only Events). */
export function canAccessConsole(role: UserRole): boolean {
  return canManage(role) || role === "resident";
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
