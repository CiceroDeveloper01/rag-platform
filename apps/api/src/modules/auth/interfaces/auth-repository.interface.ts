import { AuthSessionRecord } from './auth-session-record.interface';
import { UserRecord } from './user-record.interface';

export interface CreateUserPayload {
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'admin' | 'user';
}

export interface CreateSessionPayload {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
}

export interface AuthRepositoryInterface {
  findUserByEmail(
    email: string,
  ): Promise<(UserRecord & { passwordHash: string }) | null>;
  findUserById(userId: number): Promise<UserRecord | null>;
  createUser(payload: CreateUserPayload): Promise<UserRecord>;
  createSession(payload: CreateSessionPayload): Promise<AuthSessionRecord>;
  findSession(tokenHash: string): Promise<AuthSessionRecord | null>;
  revokeSession(tokenHash: string): Promise<void>;
  revokeSessionsByUserId(userId: number): Promise<void>;
}

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');
