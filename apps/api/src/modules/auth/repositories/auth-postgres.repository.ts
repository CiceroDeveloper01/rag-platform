import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infra/database/database.service';
import type {
  AuthRepositoryInterface,
  CreateSessionPayload,
  CreateUserPayload,
} from '../interfaces/auth-repository.interface';
import type { AuthSessionRecord } from '../interfaces/auth-session-record.interface';
import type { UserRecord } from '../interfaces/user-record.interface';

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'admin' | 'user';
  created_at: Date;
}

interface SessionRow {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

@Injectable()
export class AuthPostgresRepository implements AuthRepositoryInterface {
  constructor(private readonly databaseService: DatabaseService) {}

  async findUserByEmail(
    email: string,
  ): Promise<(UserRecord & { passwordHash: string }) | null> {
    const [row] = await this.databaseService.query<UserRow>(
      `
        SELECT id, email, password_hash, full_name, role, created_at
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [email.toLowerCase()],
    );

    if (!row) {
      return null;
    }

    return {
      ...this.mapUserRow(row),
      passwordHash: row.password_hash,
    };
  }

  async findUserById(userId: number): Promise<UserRecord | null> {
    const [row] = await this.databaseService.query<UserRow>(
      `
        SELECT id, email, password_hash, full_name, role, created_at
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId],
    );

    return row ? this.mapUserRow(row) : null;
  }

  async createUser(payload: CreateUserPayload): Promise<UserRecord> {
    const [row] = await this.databaseService.query<UserRow>(
      `
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, password_hash, full_name, role, created_at
      `,
      [
        payload.email.toLowerCase(),
        payload.passwordHash,
        payload.fullName,
        payload.role,
      ],
    );

    return this.mapUserRow(row);
  }

  async createSession(
    payload: CreateSessionPayload,
  ): Promise<AuthSessionRecord> {
    const [row] = await this.databaseService.query<SessionRow>(
      `
        INSERT INTO auth_sessions (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, token_hash, expires_at, created_at
      `,
      [payload.userId, payload.tokenHash, payload.expiresAt],
    );

    return this.mapSessionRow(row);
  }

  async findSession(tokenHash: string): Promise<AuthSessionRecord | null> {
    const [row] = await this.databaseService.query<SessionRow>(
      `
        SELECT id, user_id, token_hash, expires_at, created_at
        FROM auth_sessions
        WHERE token_hash = $1
        LIMIT 1
      `,
      [tokenHash],
    );

    return row ? this.mapSessionRow(row) : null;
  }

  async revokeSession(tokenHash: string): Promise<void> {
    await this.databaseService.query(
      `
        DELETE FROM auth_sessions
        WHERE token_hash = $1
      `,
      [tokenHash],
    );
  }

  async revokeSessionsByUserId(userId: number): Promise<void> {
    await this.databaseService.query(
      `
        DELETE FROM auth_sessions
        WHERE user_id = $1
      `,
      [userId],
    );
  }

  private mapUserRow(row: UserRow): UserRecord {
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      createdAt: new Date(row.created_at),
    };
  }

  private mapSessionRow(row: SessionRow): AuthSessionRecord {
    return {
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
    };
  }
}
