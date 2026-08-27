import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { login as loginRequest, logout as logoutRequest, LoginPayload } from '../api/endpoints/auth';
import { registerSessionExpiredHandler } from '../api/client';
import { secureStorage } from '../lib/secureStorage';
import { logger } from '../lib/logger';
import { ApiRequestError, Society, SafeUser } from '../api/types';

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
    logger.debug('auth', 'Restoring session from secure storage');
    const [accessToken, cacheRaw] = await Promise.all([
      secureStorage.getAccessToken(),
      SecureStore.getItemAsync(SESSION_CACHE_KEY),
    ]);

    if (!accessToken || !cacheRaw) {
      logger.info('auth', 'No stored session — starting signed out');
      set({ status: 'signedOut' });
      return;
    }

    try {
      const cache: SessionCache = JSON.parse(cacheRaw);
      // The token itself isn't validated here — the first real API call
      // will 401 -> refresh -> succeed or force sign-out via the
      // session-expired handler registered below. This just restores the
      // UI instantly instead of blocking on a network round trip.
      logger.info('auth', 'Session restored from cache', { userId: cache.user.id, societyId: cache.society.id });
      set({
        status: 'signedIn',
        user: cache.user,
        society: cache.society,
        permissions: cache.permissions,
        roles: cache.roles,
      });
    } catch (err) {
      logger.error('auth', 'Session cache was corrupt — starting signed out', { error: String(err) });
      set({ status: 'signedOut' });
    }
  },

  login: async (payload) => {
    logger.info('auth', 'Login attempt', { society: payload.society, email: payload.email, phone: payload.phone });
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
      logger.info('auth', 'Login succeeded', {
        userId: result.user.id,
        societyId: result.society.id,
        roles: result.roles,
        permissionCount: result.permissions.length,
      });
      set({
        status: 'signedIn',
        user: result.user,
        society: result.society,
        permissions: result.permissions,
        roles: result.roles,
        isSubmitting: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to sign in';
      const requestId = err instanceof ApiRequestError ? err.requestId : undefined;
      logger.warn('auth', 'Login failed', { message, code: err instanceof ApiRequestError ? err.code : undefined }, requestId);
      set({ isSubmitting: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    const wasSignedIn = get().status === 'signedIn';
    logger.info('auth', wasSignedIn ? 'Logging out' : 'Clearing session (forced)');
    const refreshToken = await secureStorage.getRefreshToken();
    try {
      if (refreshToken) await logoutRequest(refreshToken);
    } catch (err) {
      // Server-side revoke is best-effort; local state is cleared regardless.
      logger.warn('auth', 'Server-side logout call failed (clearing local session anyway)', { error: String(err) });
    }
    await Promise.all([secureStorage.clear(), SecureStore.deleteItemAsync(SESSION_CACHE_KEY)]);
    set({ status: 'signedOut', user: null, society: null, permissions: [], roles: [] });
  },
}));

// Wired once at module load: if the API client exhausts refresh, force the
// store (and therefore the navigator) back to the signed-out state.
registerSessionExpiredHandler(() => {
  logger.warn('auth', 'Session-expired handler fired — signing out');
  useAuthStore.getState().logout();
});
