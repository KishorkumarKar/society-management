/**
 * ---------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for where the backend lives and which API
 * version to call. Nothing else in the app should hardcode a host or a
 * "/api/v1" prefix — everything goes through API_BASE_URL below.
 * ---------------------------------------------------------------------
 *
 * To point the app at a different backend: set NEXT_PUBLIC_API_URL in
 * `.env.local` to the backend's HOST ONLY (no path), e.g.:
 *
 *   NEXT_PUBLIC_API_URL=http://192.168.29.179:4000
 *
 * To move the whole app from v1 to v2: change API_VERSION below. That's
 * the only edit needed — every request in lib/api/*.ts is built from
 * API_BASE_URL, so the new prefix applies everywhere at once.
 */

/** Bump this — and only this — to move every API call to a new version. */
export const API_VERSION = "v1";

/**
 * Backend host, no trailing slash and no `/api/...` suffix. Defensively
 * strips one off if someone pastes the old-style URL (host + /api/vN)
 * into NEXT_PUBLIC_API_URL by mistake, so a stale .env.local can't
 * produce a doubled-up "/api/v1/api/v1/..." or "//" in every request.
 */
const rawHost = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:3000";
export const API_HOST = rawHost
  .replace(/\/+$/, "") // trailing slash(es)
  .replace(/\/api\/v\d+$/i, ""); // accidental trailing /api/v1, /api/v2, ...

/** Every request in this app is built as `${API_BASE_URL}${path}`. */
export const API_BASE_URL = `${API_HOST}/api/${API_VERSION}`;

/** Joins a base URL and a path with exactly one "/" between them,
 *  regardless of whether either side already has one — this is what
 *  actually prevents the "/api/v1//auth/login" double-slash bug. */
export function joinApiPath(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
