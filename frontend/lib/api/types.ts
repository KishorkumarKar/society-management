/**
 * Shapes returned by the live backend (backend/src/modules/**). These are
 * deliberately kept separate from `@/lib/types`, which describes the app's
 * existing mock data model (`data/*.json`) — the two don't line up 1:1
 * (e.g. numeric ids vs slug-style string ids, real RBAC roles/permissions
 * vs the mock UserRole union). `lib/api/session.ts` adapts between them.
 */

/** `User.toSafeJSON()` — backend/src/domain/entities/user.entity.ts */
export interface BackendUser {
  id: number;
  societyId: number;
  flatId: number | null;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendSocietySummary {
  id: number;
  name: string;
  slug: string;
}

/** POST /auth/login response — backend/src/modules/auth/auth.service.ts */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: BackendUser;
  society: BackendSocietySummary;
  /** "<resource>.<action>" strings, e.g. "users.view". */
  permissions: string[];
  /** Role names, e.g. "Secretary", "Resident", "Super Admin". */
  roles: string[];
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * GET /societies, GET /societies/:id (societies.view only — Super Admin in
 * the seeded roles). These return the raw TypeORM entity, so — unlike
 * BackendUser / LoginResponse above — the columns are snake_case.
 */
export interface BackendSociety {
  id: number;
  name: string;
  city: string;
  address: string;
  slug: string;
  user_limit: number;
  registration_no: string | null;
  status: number;
  rate_type: string;
  rate_per_sqft: string;
  created_at: string;
  updated_at: string;
}

/** GET /announcements — also the raw entity (snake_case), plus the
 *  service's added `targetRoleIds`. */
export interface BackendAnnouncement {
  id: number;
  society_id: number;
  title: string;
  body: string;
  priority: "low" | "normal" | "high" | "urgent";
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  targetRoleIds: number[];
}

/** GET /flats — raw entity (snake_case). See
 *  backend/src/domain/entities/flat.entity.ts. */
export interface BackendFlat {
  id: number;
  society_id: number;
  block: string;
  floor: string;
  unit_no: string;
  owner_id: number | null;
  sqft: string | number;
  price_per_sqft: string | number | null;
  fix_price: string | number | null;
  created_at: string;
  updated_at: string;
}

/** GET /roles — raw entity (snake_case). `society_id: null` means a
 *  global/system role (e.g. "Super Admin"), assignable in any society. */
export interface BackendRole {
  id: number;
  society_id: number | null;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

/** GET /permissions — the global, seeded permission catalog. `name` is
 *  always `"<resource>.<action>"`. See
 *  backend/src/domain/entities/permission.entity.ts. */
export interface BackendPermission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

/** GET /events, POST/PATCH /events — raw entity (snake_case). See
 *  backend/src/domain/entities/event.entity.ts. Collections/expenses tied
 *  to an event live in separate tables (event_collections, event_expenses)
 *  and aren't included here. */
export interface BackendEvent {
  id: number;
  society_id: number;
  name: string;
  description: string | null;
  event_date: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  target_amount: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/** GET /notifications, PATCH — raw entity (snake_case). See
 *  backend/src/domain/entities/notification.entity.ts. By default a
 *  caller only ever sees their own notifications, unless they hold
 *  `notifications.view_all`. */
export interface BackendNotification {
  id: number;
  society_id: number;
  user_id: number;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  channel: "in_app" | "email" | "sms" | "push";
  created_at: string;
  updated_at: string;
}
export interface BackendHallBooking {
  id: number;
  society_id: number;
  flat_id: number;
  hall_name: string;
  start_datetime: string;
  end_datetime: string;
  purpose: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  amount: string;
  deposit: string;
  created_at: string;
  updated_at: string;
}

/** GET /maintenance-bills, POST/PATCH — raw entity plus the controller's
 *  computed `totalPaid`/`outstanding` (bill.amount + bill.penalty - sum of
 *  successful payments — see
 *  backend/src/modules/maintenance/maintenance.controller.ts). */
export interface BackendMaintenanceBill {
  id: number;
  society_id: number;
  flat_id: number;
  billing_year: number;
  billing_month: number;
  amount: string;
  due_date: string;
  status: "due" | "paid" | "overdue" | "approved";
  paid_at: string | null;
  penalty: string;
  created_at: string;
  updated_at: string;
  totalPaid: number;
  outstanding: number;
}

/** GET /maintenance-bills/:id/payments, POST — raw entity. See
 *  backend/src/domain/entities/maintenance-payment.entity.ts. */
export interface BackendMaintenancePayment {
  id: number;
  society_id: number;
  maintenance_bill_id: number;
  amount: string;
  payment_date: string;
  payment_method: "cash" | "cheque" | "upi" | "bank_transfer" | "card" | "other";
  transaction_id: string | null;
  status: "pending" | "success" | "failed" | "refunded";
  created_at: string;
  updated_at: string;
}

/** GET /expenses, POST/PATCH — raw entity (snake_case). See
 *  backend/src/domain/entities/expense.entity.ts. Distinct from
 *  event-scoped spend in event_expenses. */
export interface BackendExpense {
  id: number;
  society_id: number;
  category: string;
  vendor_name: string | null;
  amount: string;
  expense_date: string;
  approved_by: number | null;
  approved_at: string | null;
  status: "pending" | "approved" | "rejected";
  receipt_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}


/** GET /event-collections, POST/PATCH — raw entity (snake_case).
 *  Per-member contributions toward a specific event's target amount —
 *  free-text memberName/unit (not a foreign key to users/flats). See
 *  backend/src/domain/entities/event-collection.entity.ts. */
export interface BackendEventCollection {
  id: number;
  society_id: number;
  event_id: number;
  member_name: string;
  unit: string;
  amount_due: string;
  amount_paid: string;
  payment_date: string | null;
  status: "pending" | "partial" | "paid";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** GET /event-expenses, POST/PATCH — raw entity (snake_case). Spend tied
 *  to a specific event's budget, distinct from society-wide /expenses.
 *  See backend/src/domain/entities/event-expense.entity.ts. */
export interface BackendEventExpense {
  id: number;
  society_id: number;
  event_id: number;
  title: string;
  category: string;
  amount: string;
  expense_date: string;
  paid_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
