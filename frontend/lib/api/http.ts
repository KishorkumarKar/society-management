import { API_BASE_URL, joinApiPath } from "@/lib/api/config";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { getAccessToken, getRefreshToken, setAccessToken, setTokens, clearTokens } from "@/lib/api/token-store";

/** Mirrors the backend's `res.json({ success, data | error })` envelope
 *  (backend/src/utils/api-response.ts and error-handler.middleware.ts). */
interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}
interface ApiErrorEnvelope {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Network-level failure — backend unreachable, CORS, DNS, etc. Distinct
 *  from ApiError so callers/UI can show "can't reach the server" instead
 *  of a generic validation-style message. */
export class ApiNetworkError extends Error {
  constructor(message = "Could not reach the server. Please check your connection and try again.") {
    super(message);
    this.name = "ApiNetworkError";
  }
}

export interface ApiListResult<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Skip attaching the Authorization header (login itself, refresh). */
  skipAuth?: boolean;
  /** Internal: prevents infinite retry loops after one refresh attempt. */
  _isRetry?: boolean;
}

/** Every request in the app funnels through here to become a real URL —
 *  this is the only place a base URL and a path are ever concatenated, so
 *  it's also the only place a "//" double-slash bug could be introduced.
 *  `joinApiPath` (config.ts) guarantees exactly one "/" between them
 *  regardless of what either side looks like. */
function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(joinApiPath(API_BASE_URL, path));
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Runs the refresh-token rotation directly against fetch (bypassing
 *  apiFetch) so it can never itself trigger another 401 -> refresh cycle. */
async function performRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(buildUrl(ENDPOINTS.auth.refresh), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const json = (await res.json()) as ApiSuccessEnvelope<{ accessToken: string; refreshToken: string }>;
    setTokens(json.data.accessToken, json.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Central fetch wrapper for every call to the backend API. Attaches the
 * bearer access token, unwraps the `{success, data}` / `{success, error}`
 * envelope, and — on a 401 from an expired access token — transparently
 * rotates the refresh token once and retries the original request before
 * giving up and surfacing the error (at which point callers should treat
 * it as "session expired" and send the user back to /login).
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, skipAuth, _isRetry } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiNetworkError();
  }

  // Access token expired/invalid — try one silent refresh-and-retry.
  if (res.status === 401 && !skipAuth && !_isRetry) {
    const refreshed = await performRefresh();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, _isRetry: true });
    }
  }

  let json: ApiSuccessEnvelope<T> | ApiErrorEnvelope | undefined;
  try {
    json = await res.json();
  } catch {
    // No JSON body (e.g. a 204 or a proxy error page).
  }

  if (!res.ok || !json || json.success === false) {
    const err = json && json.success === false ? json.error : undefined;
    if (res.status === 401) clearTokens();
    throw new ApiError(res.status, err?.code ?? "UNKNOWN_ERROR", err?.message ?? res.statusText, err?.details);
  }

  return (json as ApiSuccessEnvelope<T>).data;
}

/** Same as apiFetch, but returns the `pagination` block alongside `data`
 *  for the list endpoints that use `paginated()` on the backend. */
export async function apiFetchList<T>(path: string, options: RequestOptions = {}): Promise<ApiListResult<T>> {
  const { method = "GET", body, query, skipAuth, _isRetry } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiNetworkError();
  }

  if (res.status === 401 && !skipAuth && !_isRetry) {
    const refreshed = await performRefresh();
    if (refreshed) {
      return apiFetchList<T>(path, { ...options, _isRetry: true });
    }
  }

  let json: ApiSuccessEnvelope<T[]> | ApiErrorEnvelope | undefined;
  try {
    json = await res.json();
  } catch {
    // no body
  }

  if (!res.ok || !json || json.success === false) {
    const err = json && json.success === false ? json.error : undefined;
    if (res.status === 401) clearTokens();
    throw new ApiError(res.status, err?.code ?? "UNKNOWN_ERROR", err?.message ?? res.statusText, err?.details);
  }

  const success = json as ApiSuccessEnvelope<T[]>;
  return {
    data: success.data,
    pagination: success.pagination ?? { page: 1, limit: success.data.length, total: success.data.length, totalPages: 1 },
  };
}

export { setAccessToken };
