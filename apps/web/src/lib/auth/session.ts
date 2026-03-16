import type { Session, UserRole } from "@/src/features/auth/types/auth.types";

export const AUTH_COOKIE_NAME = "rag_platform_session";
export const LOGIN_ROUTE = "/login";
export const PUBLIC_ROUTES = ["/", "/login"];
export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/chat",
  "/documents",
  "/observability",
];

export function clearStoredSession(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function hasRequiredRole(
  session: Session | null,
  role: UserRole,
): boolean {
  if (!session?.user) {
    return false;
  }

  if (session.user.role === "admin") {
    return true;
  }

  return session.user.role === role;
}
