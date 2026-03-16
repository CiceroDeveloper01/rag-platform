export type UserRole = "admin" | "user";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Session {
  token?: string;
  expiresAt: string;
  user: User;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}
