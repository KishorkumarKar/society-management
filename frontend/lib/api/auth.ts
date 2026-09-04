import { apiFetch } from "@/lib/api/http";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { getRefreshToken, setTokens, clearTokens } from "@/lib/api/token-store";
import type { LoginResponse, RefreshResponse } from "@/lib/api/types";

export interface LoginCredentials {
  /** Society slug, e.g. "green-valley" — not the display name. */
  society: string;
  email?: string;
  phone?: string;
  password: string;
}

/** POST /auth/login. Stores the returned token pair on success. */
export async function loginRequest(credentials: LoginCredentials): Promise<LoginResponse> {
  const result = await apiFetch<LoginResponse>(ENDPOINTS.auth.login, {
    method: "POST",
    body: credentials,
    skipAuth: true,
  });
  setTokens(result.accessToken, result.refreshToken);
  return result;
}

/** POST /auth/refresh. Used for an explicit/manual refresh; apiFetch also
 *  calls the backend directly for its own transparent retry-on-401. */
export async function refreshSession(): Promise<RefreshResponse | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  const result = await apiFetch<RefreshResponse>(ENDPOINTS.auth.refresh, {
    method: "POST",
    body: { refreshToken },
    skipAuth: true,
  });
  setTokens(result.accessToken, result.refreshToken);
  return result;
}

/** POST /auth/logout. Best-effort — always clears local tokens even if the
 *  network call fails, so the user is signed out locally regardless. */
export async function logoutRequest(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiFetch<{ loggedOut: boolean }>(ENDPOINTS.auth.logout, {
        method: "POST",
        body: { refreshToken },
        skipAuth: true,
      });
    }
  } catch {
    // Logging out locally still proceeds even if the API call fails
    // (e.g. token already expired, backend unreachable).
  } finally {
    clearTokens();
  }
}
