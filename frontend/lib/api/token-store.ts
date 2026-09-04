/**
 * Persists the JWT pair issued by POST /auth/login (and rotated by
 * POST /auth/refresh) for the current tab session. sessionStorage matches
 * the existing session behaviour in AuthContext (cleared when the tab
 * closes) and keeps tokens out of localStorage / cookies.
 */

const ACCESS_TOKEN_KEY = "sms-access-token";
const REFRESH_TOKEN_KEY = "sms-refresh-token";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function setAccessToken(accessToken: string): void {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}
