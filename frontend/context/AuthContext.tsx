"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthenticatedUser } from "@/lib/types";
import type { LoginResponse } from "@/lib/api/types";
import { loginRequest, logoutRequest, refreshSession } from "@/lib/api/auth";
import { toAuthenticatedUser } from "@/lib/api/session";
import { ApiError, ApiNetworkError } from "@/lib/api/http";
import { getRefreshToken } from "@/lib/api/token-store";

/** Everything except the tokens (which live under lib/api/token-store's own
 *  sessionStorage keys) — just enough to rebuild `AuthenticatedUser` and
 *  survive a page reload without re-calling /auth/login. Re-validated
 *  against the backend on mount via a silent refresh (see below), so a
 *  revoked/expired session doesn't leave stale data behind. */
const SESSION_PROFILE_KEY = "sms-session-profile";

interface LoginResult {
  success: boolean;
  message?: string;
  user?: AuthenticatedUser;
}

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (society: string, identifier: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function saveProfile(login: LoginResponse) {
  const { accessToken: _a, refreshToken: _r, ...profile } = login;
  window.sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(profile));
}

function loadProfile(): Omit<LoginResponse, "accessToken" | "refreshToken"> | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearProfile() {
  window.sessionStorage.removeItem(SESSION_PROFILE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: if we have a refresh token + cached profile from a previous
  // visit, silently rotate the token pair to confirm the session is still
  // valid before trusting the cached profile. A failed refresh (expired,
  // revoked, backend unreachable) just leaves the user signed out — it
  // never throws up to the caller.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const cachedProfile = loadProfile();
      const hasRefreshToken = !!getRefreshToken();

      if (!cachedProfile || !hasRefreshToken) {
        clearProfile();
        setIsLoading(false);
        return;
      }

      try {
        const refreshed = await refreshSession();
        if (!refreshed) throw new Error("no refresh token");
        if (!cancelled) {
          setUser(toAuthenticatedUser({ ...cachedProfile, ...refreshed }));
        }
      } catch {
        clearProfile();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (society: string, identifier: string, password: string): Promise<LoginResult> => {
      if (!society.trim()) {
        return { success: false, message: "Enter your society's login code." };
      }
      if (!identifier.trim() || !password) {
        return { success: false, message: "Enter your email or phone and password." };
      }

      const credentials = identifier.includes("@")
        ? { society: society.trim(), email: identifier.trim(), password }
        : { society: society.trim(), phone: identifier.trim(), password };

      try {
        const result = await loginRequest(credentials);
        const authedUser = toAuthenticatedUser(result);
        saveProfile(result);
        setUser(authedUser);
        return { success: true, user: authedUser };
      } catch (err) {
        if (err instanceof ApiError) {
          return { success: false, message: err.message };
        }
        if (err instanceof ApiNetworkError) {
          return { success: false, message: err.message };
        }
        return { success: false, message: "Unable to sign in. Please try again." };
      }
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    clearProfile();
    // Best-effort: revokes the refresh token server-side and clears local
    // tokens. Fired without awaiting so callers can navigate immediately.
    void logoutRequest();
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
