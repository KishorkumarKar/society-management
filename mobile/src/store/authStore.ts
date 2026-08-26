import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { login as loginRequest, logout as logoutRequest, LoginPayload } from '../api/endpoints/auth';
import { registerSessionExpiredHandler } from '../api/client';
import { secureStorage } from '../lib/secureStorage';
import { Society, SafeUser } from '../api/types';

// User + society + roles are cached (not secret) so the app can restore the
// shell instantly on cold start while the access token is separately
// re-validated on the first authenticated request. Nothing sensitive
// (passwords, tokens) is ever written to this key.
const SESSION_CACHE_KEY = 'sl_session_cache';

interface SessionCache {
  user: SafeUser;
  society: Society;
  permissions: string[];
  roles: string[];
}

type AuthStatus = 'unknown' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  user: SafeUser | null;
  society: Society | null;
  permissions: string[];
  roles: string[];
  error: string | null;
  isSubmitting: boolean;
  restoreSession: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'unknown',
  user: null,
  society: null,
  permissions: [],
  roles: [],
  error: null,
  isSubmitting: false,

  restoreSession: async () => {
    const [accessToken, cacheRaw] = await Promise.all([
      secureStorage.getAccessToken(),
      SecureStore.getItemAsync(SESSION_CACHE_KEY),
    ]);

    if (!accessToken || !cacheRaw) {
      set({ status: 'signedOut' });
      return;
    }

    try {
      const cache: SessionCache = JSON.parse(cacheRaw);
      // The token itself isn't validated here — the first real API call
      // will 401 -> refresh -> succeed or force sign-out via the
      // session-expired handler registered below. This just restores the
      // UI instantly instead of blocking on a network round trip.
      set({
        status: 'signedIn',
        user: cache.user,
        society: cache.society,
        permissions: cache.permissions,
        roles: cache.roles,
      });
    } catch {
      set({ status: 'signedOut' });
    }
  },

  login: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const result = await loginRequest(payload);
      await secureStorage.setTokens(result.accessToken, result.refreshToken);
      const cache: SessionCache = {
        user: result.user,
        society: result.society,
        permissions: result.permissions,
        roles: result.roles,
      };
      await SecureStore.setItemAsync(SESSION_CACHE_KEY, JSON.stringify(cache));
      set({
        status: 'signedIn',
        user: result.user,
        society: result.society,
        permissions: result.permissions,
        roles: result.roles,
        isSubmitting: false,
      });
    } catch (err: any) {
      set({ isSubmitting: false, error: err?.message ?? 'Unable to sign in' });
      throw err;
    }
  },

  logout: async () => {
    const refreshToken = await secureStorage.getRefreshToken();
    try {
      if (refreshToken) await logoutRequest(refreshToken);
    } catch {
      // Server-side revoke is best-effort; local state is cleared regardless.
    }
    await Promise.all([secureStorage.clear(), SecureStore.deleteItemAsync(SESSION_CACHE_KEY)]);
    set({ status: 'signedOut', user: null, society: null, permissions: [], roles: [] });
  },
}));

// Wired once at module load: if the API client exhausts refresh, force the
// store (and therefore the navigator) back to the signed-out state.
registerSessionExpiredHandler(() => {
  useAuthStore.getState().logout();
});
