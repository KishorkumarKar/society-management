const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

/**
 * Fetch wrapper that injects the access-token header and
 * automatically attempts one silent refresh on 401.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE}${path}`;
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("sms_access_token")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(url, { ...options, headers });

  // Silent refresh (don't loop on refresh/logout calls)
  if (
    res.status === 401 &&
    token &&
    !path.includes("/auth/refresh") &&
    !path.includes("/auth/logout")
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch(path, options);
    }
  }

  return res;
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("sms_refresh_token");
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const json: ApiResponse<{ accessToken: string; refreshToken: string }> =
      await res.json();

    if (json.success && json.data) {
      localStorage.setItem("sms_access_token", json.data.accessToken);
      localStorage.setItem("sms_refresh_token", json.data.refreshToken);
      return true;
    }

    clearTokens();
    return false;
  } catch {
    clearTokens();
    return false;
  }
}

export function clearTokens() {
  localStorage.removeItem("sms_access_token");
  localStorage.removeItem("sms_refresh_token");
}