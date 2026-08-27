/**
 * Mirrors backend/src/utils/api-response.ts exactly. Every endpoint returns
 * one of these two success shapes, or the error shape from
 * backend/src/middleware/error-handler.middleware.ts. Do not invent a
 * different envelope client-side.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiPaginated<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Normalized shape thrown by the client on any non-2xx response. */
export class ApiRequestError extends Error {
  code: string;
  status: number;
  details?: unknown;
  /** Correlates with the backend's req.requestId — include this in bug reports. */
  requestId?: string;

  constructor(status: number, code: string, message: string, details?: unknown, requestId?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

// --- Entities ---------------------------------------------------------
//
// IMPORTANT — the backend is NOT uniformly cased. Verified against the
// actual source (entities, validators, service input interfaces,
// controllers), not assumed:
//   • REQUEST bodies are camelCase everywhere (Joi validators + service
//     Input interfaces: unitNo, billingYear, isActive, expenseDate, ...).
//   • RESPONSE bodies are the raw TypeORM entity UNLESS the entity defines
//     an explicit safe-serializer. Only User has one (toSafeJSON(), in
//     domain/entities/user.entity.ts) — its response IS camelCase
//     (isActive, flatId, createdAt...). Every other entity used here
//     (Role, Permission, Flat, Expense, MaintenanceBill,
//     MaintenancePayment, Announcement) has no such method, so its
//     response is the entity's own snake_case columns.
// Each interface below is commented with which side (request/response)
// it represents and where it was verified.

export interface Society {
  id: number;
  name: string;
  slug: string;
}

// Response shape — from User.toSafeJSON() (domain/entities/user.entity.ts).
// Camelcase is deliberate here; every other entity in this file is not.
export interface SafeUser {
  id: number;
  societyId: number;
  flatId: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
  society: Society;
  permissions: string[];
  roles: string[];
}

// Response shape — raw Role entity (no safe-serializer), snake_case.
export interface Role {
  id: number;
  society_id: number | null;
  name: string;
  description: string | null;
}

// Response shape — raw Permission entity, snake_case.
export interface Permission {
  id: number;
  name: string; // "resource.action"
  resource: string;
  action: string;
  description: string | null;
}

// Response shape — raw Flat entity (domain/entities/flat.entity.ts).
// Verified against flats.service.ts: `sqft`/`price_per_sqft`/`fix_price`
// are stored as decimal strings, exactly as TypeORM returns them.
export interface Flat {
  id: number;
  society_id: number;
  block: string;
  floor: string;
  unit_no: string;
  owner_id: number | null;
  sqft: string;
  price_per_sqft: string | null;
  fix_price: string | null;
  created_at: string;
}

export type MaintenanceBillStatus = 'due' | 'paid' | 'overdue' | 'approved';

// Response shape — GET list/detail merge the raw MaintenanceBill entity
// with computed `totalPaid`/`outstanding` (see maintenance.controller.ts's
// `serializeBillWithOutstanding`) — this is the actual wire shape, not an
// invented convenience field.
export interface MaintenanceBill {
  id: number;
  society_id: number;
  flat_id: number;
  billing_year: number;
  billing_month: number;
  amount: string;
  due_date: string;
  status: MaintenanceBillStatus;
  paid_at: string | null;
  penalty: string;
  totalPaid: number;
  outstanding: number;
}

export type PaymentMethod = 'cash' | 'cheque' | 'upi' | 'bank_transfer' | 'card' | 'other';

// Response shape — raw MaintenancePayment entity, snake_case.
export interface MaintenancePayment {
  id: number;
  society_id: number;
  maintenance_bill_id: number;
  amount: string;
  payment_date: string;
  payment_method: PaymentMethod;
  transaction_id: string | null;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  created_at: string;
}

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

// Response shape — raw Expense entity, snake_case.
export interface Expense {
  id: number;
  society_id: number;
  category: string;
  vendor_name: string | null;
  amount: string;
  expense_date: string;
  approved_by: number | null;
  approved_at: string | null;
  status: ExpenseStatus;
  receipt_url: string | null;
  description: string | null;
  created_at: string;
}

export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

// Response shape — raw Announcement entity spread with `targetRoleIds`
// (see announcements.controller.ts's `serialize`). `sent_at` is null until
// POST /announcements/:id/send is called — there is no separate boolean.
export interface Announcement {
  id: number;
  society_id: number;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  sent_at: string | null;
  targetRoleIds: number[];
  created_at: string;
}

// NOT independently re-verified in this pass — kept from the original,
// unverified build. Hall Bookings' real service interface
// (CreateHallBookingInput: hallName/bookingDate/timeSlot/deposit/amount)
// looked meaningfully different from this shape when spot-checked; treat
// this type and hall-bookings.ts as suspect until checked the same way
// Flats/Expenses/Maintenance/Announcements were.
export interface HallBooking {
  id: number;
  society_id: number;
  flat_id: number;
  purpose: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

// NOT independently re-verified in this pass — same caveat as HallBooking.
export interface AppNotification {
  id: number;
  society_id: number;
  user_id: number;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}
