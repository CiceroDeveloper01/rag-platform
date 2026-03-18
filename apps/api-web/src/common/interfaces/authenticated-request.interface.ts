import type { Request } from 'express';

export interface AuthenticatedUser {
  id: number;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  authSessionToken?: string;
}
