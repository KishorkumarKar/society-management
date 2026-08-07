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
import { findUser, getSocietyById } from "@/lib/data";
import type { AuthenticatedUser } from "@/lib/types";

const SESSION_KEY = "sms-session";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (
    societyId: string,
    identifier: string,
    password: string
  ) => { success: boolean; message?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        setUser(JSON.parse(raw) as AuthenticatedUser);
      }
    } catch {
      // ignore malformed session data
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    (societyId: string, identifier: string, password: string) => {
      if (!societyId) {
        return { success: false, message: "Choose your society to continue." };
      }
      if (!identifier || !password) {
        return {
          success: false,
          message: "Enter your email or phone and password.",
        };
      }

      const match = findUser(societyId, identifier, password);
      if (!match) {
        return {
          success: false,
          message: "Those details don't match our records for this society.",
        };
      }

      const society = getSocietyById(societyId);
      const authedUser: AuthenticatedUser = {
        ...match,
        societyName: society?.name ?? "Unknown Society",
      };

      setUser(authedUser);
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(authedUser));
      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    window.sessionStorage.removeItem(SESSION_KEY);
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
