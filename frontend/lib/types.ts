export type UserRole = "super-admin" | "admin" | "committee" | "resident" | "security";

/** Sentinel societyId for the platform-wide Super Admin account and the
 *  special option in the login form's Society dropdown used to sign in as one. */
export const PLATFORM_SCOPE = "platform";

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
  /** Committee/society post — e.g. Chairperson, Secretary, Treasurer —
   *  distinct from `role`, which controls system permissions. */
  designation: string;
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

export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface SocietyEvent {
  id: string;
  societyId: string;
  name: string;
  description: string;
  date: string;
  status: EventStatus;
  /** Target collection amount for the event, e.g. a per-event fund goal. */
  targetAmount: number;
  createdBy: string;
}

export type CollectionStatus = "paid" | "partial" | "pending";

/** One member's contribution record for a single event. */
export interface EventCollection {
  id: string;
  eventId: string;
  societyId: string;
  memberName: string;
  unit: string;
  amountDue: number;
  amountPaid: number;
  paymentDate: string;
  status: CollectionStatus;
  notes: string;
}

/** One expense line item for a single event. */
export interface EventExpense {
  id: string;
  eventId: string;
  societyId: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paidTo: string;
  notes: string;
}

/**
 * Static ACL matrix, shaped to be a near drop-in for a future
 * `GET /api/acl` response: one row per role, each listing the
 * "<module>:<action>" permission strings it holds. Swap
 * `data/acl.json` for a live fetch later without touching the UI.
 */
export type AclAction = "view" | "create" | "edit" | "delete";
export type AclModule =
  | "Users"
  | "Notices"
  | "Events"
  | "Collections"
  | "Expenses"
  | "Societies"
  | "ACL";

export interface AclRoleEntry {
  role: UserRole;
  label: string;
  permissions: Partial<Record<AclModule, AclAction[]>>;
}
