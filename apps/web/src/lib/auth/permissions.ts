import type { Session, UserRole } from "@/src/features/auth/types/auth.types";

export function isAuthenticated(session: Session | null): boolean {
  return Boolean(session?.token);
}

export function hasRole(session: Session | null, role: UserRole): boolean {
  if (!session?.user) {
    return false;
  }

  return session.user.role === "admin" || session.user.role === role;
}
