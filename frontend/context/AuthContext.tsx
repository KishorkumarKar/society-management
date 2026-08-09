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
import { findUser, getSocietyById, findAdminUser } from "@/lib/data";
import type { AuthenticatedUser, AdminSessionUser } from "@/lib/types";

const SESSION_KEY = "sms-session";
const ADMIN_SESSION_KEY = "sms-admin-session";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  admin: AdminSessionUser | null;
  isLoading: boolean;
  login: (
    societyId: string,
    identifier: string,
    password: string
  ) => { success: boolean; message?: string };
  adminLogin: (
    email: string,
    password: string
  ) => { success: boolean; message?: string };
  logout: () => void;
  adminLogout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [admin, setAdmin] = useState<AdminSessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        setUser(JSON.parse(raw) as AuthenticatedUser);
      }
      const adminRaw = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (adminRaw) {
        setAdmin(JSON.parse(adminRaw) as AdminSessionUser);
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

  const adminLogin = useCallback((email: string, password: string) => {
    if (!email || !password) {
      return { success: false, message: "Enter email and password." };
    }
    const match = findAdminUser(email, password);
    if (!match) {
      return { success: false, message: "Invalid admin credentials." };
    }
    setAdmin(match);
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(match));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    window.sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const adminLogout = useCallback(() => {
    setAdmin(null);
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }, []);

  const value = useMemo(
    () => ({ user, admin, isLoading, login, adminLogin, logout, adminLogout }),
    [user, admin, isLoading, login, adminLogin, logout, adminLogout]
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