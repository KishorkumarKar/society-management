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
export type AclAction = "view" | "create" | "edit" | "delete" | "mark_in" | "mark_out";
export type AclModule =
  | "Users"
  | "Notices"
  | "Events"
  | "Collections"
  | "Expenses"
  | "Societies"
  | "ACL"
  | "Security Guards"
  | "Security Shifts"
  | "Visitors";

export interface AclRoleEntry {
  role: UserRole;
  label: string;
  permissions: Partial<Record<AclModule, AclAction[]>>;
}

/** Which actions are meaningful for each module — drives which action
 *  columns the ACL grid renders per tab, so a module never shows a
 *  toggle for an action it doesn't actually support. */
export const MODULE_ACTIONS: Record<AclModule, AclAction[]> = {
  Users: ["view", "create", "edit", "delete"],
  Notices: ["view", "create", "edit", "delete"],
  Events: ["view", "create", "edit", "delete"],
  Collections: ["view", "create", "edit", "delete"],
  Expenses: ["view", "create", "edit", "delete"],
  Societies: ["view", "create", "edit", "delete"],
  ACL: ["view", "edit"],
  "Security Guards": ["view", "create", "edit", "delete"],
  "Security Shifts": ["view", "create", "edit", "delete"],
  Visitors: ["view", "create", "edit", "delete", "mark_in", "mark_out"],
};

export type GuardStatus = "active" | "inactive";

export interface SecurityGuard {
  id: string;
  societyId: string;
  name: string;
  phone: string;
  employeeCode: string;
  address: string;
  joiningDate: string;
  status: GuardStatus;
}

/** 12H / 8H / Half day are common presets; CUSTOM lets a society define
 *  any start/end time and duration of its own. */
export type ShiftType = "12H" | "8H" | "HALF_DAY" | "CUSTOM";
export type ShiftStatus = "scheduled" | "active" | "completed" | "cancelled";

export interface SecurityShift {
  id: string;
  societyId: string;
  shiftName: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  durationHours: number;
  guardId: string;
  shiftDate: string;
  status: ShiftStatus;
  remarks: string;
}

export type VisitorType =
  | "Guest"
  | "Delivery"
  | "Cab/Taxi"
  | "Service Provider"
  | "Domestic Help"
  | "Vendor"
  | "Other";

export type VisitorStatus = "in" | "out";

export interface Visitor {
  id: string;
  societyId: string;
  /** The unit/flat the visitor is calling on — matched against SocietyUser.unit. */
  flatId: string;
  visitorName: string;
  phone: string;
  vehicleNumber: string;
  visitorType: VisitorType;
  purpose: string;
  numberOfPersons: number;
  inDate: string;
  inTime: string;
  outDate: string;
  outTime: string;
  status: VisitorStatus;
  remarks: string;
  createdBy: string;
}
