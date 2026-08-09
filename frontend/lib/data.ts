import societiesData from "@/data/societies.json";
import usersData from "@/data/users.json";
import plansData from "@/data/plans.json";
import noticesData from "@/data/notices.json";
import type {
  Society,
  SocietyUser,
  Plan,
  Notice,
  UserRole,
  AdminSessionUser,
  SocietyEvent,
  EventCollection,
  EventExpense,
} from "@/lib/types";

export const societies = societiesData as Society[];
export const users = usersData as SocietyUser[];
export const plans = plansData as Plan[];
export const notices = noticesData as Notice[];

export function getSocietyBySlug(slug: string): Society | undefined {
  return societies.find((s) => s.slug === slug);
}

export function getSocietyById(id: string): Society | undefined {
  return societies.find((s) => s.id === id);
}

export function findUser(
  societyId: string,
  identifier: string,
  password: string,
): SocietyUser | undefined {
  const normalized = identifier.trim().toLowerCase();
  return users.find(
    (u) =>
      u.societyId === societyId &&
      u.password === password &&
      (u.email.toLowerCase() === normalized || u.phone === identifier.trim()),
  );
}

export function getUsersBySociety(societyId: string): SocietyUser[] {
  return users.filter((u) => u.societyId === societyId);
}

export function getNoticesBySociety(societyId: string): Notice[] {
  return notices
    .filter((n) => n.societyId === societyId)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export function roleLabel(role: UserRole): string {
  switch (role) {
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

// ── Admin helpers ──
const ADMIN_PASSWORD = "admin123";

export function findAdminUser(
  email: string,
  password: string,
): AdminSessionUser | undefined {
  const normalized = email.trim().toLowerCase();
  if (password !== ADMIN_PASSWORD) return undefined;

  // Super admin
  if (normalized === "superadmin@societyledger.com") {
    return {
      id: "super-1",
      name: "Super Administrator",
      email: normalized,
      role: "super_admin",
    };
  }

  // Society admins
  const match = users.find(
    (u) => u.email.toLowerCase() === normalized && u.role === "admin",
  );
  if (match) {
    const society = getSocietyById(match.societyId);
    return {
      id: match.id,
      name: match.name,
      email: match.email,
      role: "admin",
      societyId: match.societyId,
      societyName: society?.name,
    };
  }
  return undefined;
}

export function getAllUsers(): SocietyUser[] {
  return users;
}

export function getAllNotices(): Notice[] {
  return notices.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAllSocieties(): Society[] {
  return societies;
}

// CRUD helpers (in-memory for demo)
let userIdCounter = users.length + 1;
let noticeIdCounter = notices.length + 1;
let societyIdCounter = societies.length + 1;

export function addUser(user: Omit<SocietyUser, "id">): SocietyUser {
  const newUser = { ...user, id: String(userIdCounter++) };
  users.push(newUser);
  return newUser;
}

export function updateUser(
  id: string,
  updates: Partial<SocietyUser>,
): SocietyUser | undefined {
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return undefined;
  users[idx] = { ...users[idx], ...updates };
  return users[idx];
}

export function deleteUser(id: string): boolean {
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return false;
  users.splice(idx, 1);
  return true;
}

export function addNotice(notice: Omit<Notice, "id">): Notice {
  const newNotice = { ...notice, id: String(noticeIdCounter++) };
  notices.push(newNotice);
  return newNotice;
}

export function updateNotice(
  id: string,
  updates: Partial<Notice>,
): Notice | undefined {
  const idx = notices.findIndex((n) => n.id === id);
  if (idx === -1) return undefined;
  notices[idx] = { ...notices[idx], ...updates };
  return notices[idx];
}

export function deleteNotice(id: string): boolean {
  const idx = notices.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  notices.splice(idx, 1);
  return true;
}

export function addSociety(society: Omit<Society, "id">): Society {
  const newSociety = { ...society, id: String(societyIdCounter++) };
  societies.push(newSociety);
  return newSociety;
}

export function updateSociety(
  id: string,
  updates: Partial<Society>,
): Society | undefined {
  const idx = societies.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  societies[idx] = { ...societies[idx], ...updates };
  return societies[idx];
}

export function deleteSociety(id: string): boolean {
  const idx = societies.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  societies.splice(idx, 1);
  return true;
}

// ── Event Management Data ──
let eventsData: SocietyEvent[] = [
  {
    id: "e1",
    societyId: "1",
    name: "Halloween Bash 2026",
    description:
      "Annual Halloween celebration with costume contest, games, and dinner.",
    eventDate: "2026-10-31",
    status: "upcoming",
    budget: 50000,
    createdAt: "2026-08-01",
  },
  {
    id: "e2",
    societyId: "1",
    name: "Diwali Mela",
    description:
      "Festival of lights celebration with fireworks and cultural programs.",
    eventDate: "2026-11-12",
    status: "upcoming",
    budget: 75000,
    createdAt: "2026-08-05",
  },
];

let collectionsData: EventCollection[] = [
  {
    id: "c1",
    eventId: "e1",
    userId: "u1",
    userName: "Rahul Sharma",
    amount: 2000,
    paidAt: "2026-08-10",
    method: "upi",
    status: "paid",
  },
  {
    id: "c2",
    eventId: "e1",
    userId: "u2",
    userName: "Priya Patel",
    amount: 2000,
    paidAt: "2026-08-11",
    method: "cash",
    status: "paid",
  },
  {
    id: "c3",
    eventId: "e1",
    userId: "u3",
    userName: "Amit Kumar",
    amount: 2000,
    paidAt: "",
    method: "upi",
    status: "pending",
  },
  {
    id: "c4",
    eventId: "e2",
    userId: "u1",
    userName: "Rahul Sharma",
    amount: 3000,
    paidAt: "2026-08-12",
    method: "bank_transfer",
    status: "paid",
  },
];

let eventExpensesData: EventExpense[] = [
  {
    id: "ex1",
    eventId: "e1",
    description: "Decoration materials",
    vendor: "PartyZone Decorators",
    amount: 12000,
    spentAt: "2026-08-15",
    category: "Decor",
  },
  {
    id: "ex2",
    eventId: "e1",
    description: "Catering advance",
    vendor: "Tasty Bites Catering",
    amount: 15000,
    spentAt: "2026-08-16",
    category: "Food",
  },
  {
    id: "ex3",
    eventId: "e2",
    description: "Fireworks permit",
    vendor: "City Fireworks Co.",
    amount: 25000,
    spentAt: "2026-08-10",
    category: "Permits",
  },
];

let eventIdCounter = eventsData.length + 1;
let collectionIdCounter = collectionsData.length + 1;
let expenseIdCounter = eventExpensesData.length + 1;

export function getAllEvents(): SocietyEvent[] {
  return [...eventsData];
}

export function getEventsBySociety(societyId: string): SocietyEvent[] {
  return eventsData.filter((e) => e.societyId === societyId);
}

export function getEventById(id: string): SocietyEvent | undefined {
  return eventsData.find((e) => e.id === id);
}

export function addEvent(
  event: Omit<SocietyEvent, "id" | "createdAt">,
): SocietyEvent {
  const newEvent: SocietyEvent = {
    ...event,
    id: `e${eventIdCounter++}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  eventsData.push(newEvent);
  return newEvent;
}

export function updateEvent(
  id: string,
  updates: Partial<SocietyEvent>,
): SocietyEvent | undefined {
  const idx = eventsData.findIndex((e) => e.id === id);
  if (idx === -1) return undefined;
  eventsData[idx] = { ...eventsData[idx], ...updates };
  return eventsData[idx];
}

export function deleteEvent(id: string): boolean {
  const idx = eventsData.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  eventsData.splice(idx, 1);
  // Cascade delete collections and expenses
  collectionsData = collectionsData.filter((c) => c.eventId !== id);
  eventExpensesData = eventExpensesData.filter((ex) => ex.eventId !== id);
  return true;
}

// Collections
export function getAllCollections(): EventCollection[] {
  return [...collectionsData];
}

export function getCollectionsByEvent(eventId: string): EventCollection[] {
  return collectionsData.filter((c) => c.eventId === eventId);
}

export function getCollectionsBySociety(societyId: string): EventCollection[] {
  const eventIds = eventsData
    .filter((e) => e.societyId === societyId)
    .map((e) => e.id);
  return collectionsData.filter((c) => eventIds.includes(c.eventId));
}

export function addCollection(
  collection: Omit<EventCollection, "id">,
): EventCollection {
  const newCollection: EventCollection = {
    ...collection,
    id: `c${collectionIdCounter++}`,
  };
  collectionsData.push(newCollection);
  return newCollection;
}

export function updateCollection(
  id: string,
  updates: Partial<EventCollection>,
): EventCollection | undefined {
  const idx = collectionsData.findIndex((c) => c.id === id);
  if (idx === -1) return undefined;
  collectionsData[idx] = { ...collectionsData[idx], ...updates };
  return collectionsData[idx];
}

export function deleteCollection(id: string): boolean {
  const idx = collectionsData.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  collectionsData.splice(idx, 1);
  return true;
}

// Expenses
export function getAllExpenses(): EventExpense[] {
  return [...eventExpensesData];
}

export function getExpensesByEvent(eventId: string): EventExpense[] {
  return eventExpensesData.filter((ex) => ex.eventId === eventId);
}

export function getExpensesBySociety(societyId: string): EventExpense[] {
  const eventIds = eventsData
    .filter((e) => e.societyId === societyId)
    .map((e) => e.id);
  return eventExpensesData.filter((ex) => eventIds.includes(ex.eventId));
}

export function addExpense(expense: Omit<EventExpense, "id">): EventExpense {
  const newExpense: EventExpense = {
    ...expense,
    id: `ex${expenseIdCounter++}`,
  };
  eventExpensesData.push(newExpense);
  return newExpense;
}

export function updateExpense(
  id: string,
  updates: Partial<EventExpense>,
): EventExpense | undefined {
  const idx = eventExpensesData.findIndex((ex) => ex.id === id);
  if (idx === -1) return undefined;
  eventExpensesData[idx] = { ...eventExpensesData[idx], ...updates };
  return eventExpensesData[idx];
}

export function deleteExpense(id: string): boolean {
  const idx = eventExpensesData.findIndex((ex) => ex.id === id);
  if (idx === -1) return false;
  eventExpensesData.splice(idx, 1);
  return true;
}

// Event summary helpers
export function getEventSummary(eventId: string) {
  const event = getEventById(eventId);
  if (!event) return null;
  const collections = getCollectionsByEvent(eventId);
  const expenses = getExpensesByEvent(eventId);
  const totalCollected = collections
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);
  const totalPending = collections
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.amount, 0);
  const totalSpent = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  return {
    event,
    totalCollected,
    totalPending,
    totalSpent,
    balance: totalCollected - totalSpent,
    collectionCount: collections.length,
    expenseCount: expenses.length,
  };
}

export function getNoticeById(id: string): Notice | undefined {
  return notices.find((n) => n.id === id);
}
