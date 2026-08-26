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

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// --- Entities (shape follows toSafeJSON() / entity fields used by the
// controllers — see backend/src/domain/entities/*.ts and each module's
// service). Kept intentionally close to the wire format rather than
// remapped, so payloads can be trusted without a translation layer. ---

export interface Society {
  id: number;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
}

export interface SafeUser {
  id: number;
  society_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
  society: Society;
  permissions: string[];
  roles: string[];
}

export interface Role {
  id: number;
  society_id: number;
  name: string;
  description?: string | null;
}

export interface Permission {
  id: number;
  name: string; // "resource.action"
  resource: string;
  action: string;
  description: string;
}

export interface Flat {
  id: number;
  society_id: number;
  unit_number: string;
  block?: string | null;
  floor?: number | null;
  status: string;
}

export interface MaintenanceBill {
  id: number;
  society_id: number;
  flat_id: number;
  period: string;
  amount: number;
  amount_paid: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  due_date: string;
}

export interface MaintenancePayment {
  id: number;
  maintenance_bill_id: number;
  amount: number;
  paid_at: string;
  method?: string;
}

export interface Expense {
  id: number;
  society_id: number;
  category: string;
  amount: number;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  incurred_on: string;
}

export interface Announcement {
  id: number;
  society_id: number;
  title: string;
  body: string;
  is_sent: boolean;
  created_at: string;
}

export interface HallBooking {
  id: number;
  society_id: number;
  flat_id: number;
  purpose: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

export interface AppNotification {
  id: number;
  society_id: number;
  user_id: number;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}
