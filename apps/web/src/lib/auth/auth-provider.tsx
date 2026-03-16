"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApiService } from "@/src/features/auth/services/auth-api.service";
import type {
  AuthState,
  LoginPayload,
  Session,
  UserRole,
} from "@/src/features/auth/types/auth.types";
import { clearStoredSession, hasRequiredRole } from "./session";

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const nextSession = await authApiService.getMe();

        if (isMounted) {
          setSession(nextSession);
        }
      } catch {
        if (isMounted) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function login(payload: LoginPayload) {
    const nextSession = await authApiService.login(payload);
    setSession(nextSession);
  }

  async function logout() {
    try {
      await authApiService.logout();
    } finally {
      clearStoredSession();
      setSession(null);
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(session),
      isLoading,
      session,
      user: session?.user ?? null,
      login,
      logout,
      hasRole: (role) => hasRequiredRole(session, role),
    }),
    [isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
