export type UserRole = "super_admin" | "admin" | "committee" | "resident" | "security";

export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
export type CollectionStatus = "paid" | "pending" | "waived";
export type PaymentMethod = "cash" | "upi" | "bank_transfer";

export interface Society {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  established: number;
  totalUnits: number;
  occupiedUnits: number;
  initial: string;
  registrationNo: string;
}

export interface SocietyUser {
  id: string;
  societyId: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  unit: string;
  initial: string;
}

export interface Notice {
  id: string;
  societyId: string;
  title: string;
  category: string;
  date: string;
  body: string;
}

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: number | null;
  billing: string;
  unitCap: string;
  features: string[];
  highlighted: boolean;
}

export interface AuthenticatedUser extends SocietyUser {
  societyName: string;
}

export interface AdminSessionUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin";
  societyId?: string;
  societyName?: string;
}

// ── Event Management ──
export interface SocietyEvent {
  id: string;
  societyId: string;
  name: string;
  description: string;
  eventDate: string;
  status: EventStatus;
  budget: number;
  createdAt: string;
}

export interface EventCollection {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  amount: number;
  paidAt: string;
  method: PaymentMethod;
  status: CollectionStatus;
}

export interface EventExpense {
  id: string;
  eventId: string;
  description: string;
  vendor: string;
  amount: number;
  spentAt: string;
  receiptUrl?: string;
  category: string;
}