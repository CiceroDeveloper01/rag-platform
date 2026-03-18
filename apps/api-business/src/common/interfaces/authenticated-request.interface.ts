import type { Request } from 'express';

export interface AuthenticatedUser {
  id: number;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  scopes?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  authSessionToken?: string;
  service?: import('../auth/interfaces/authenticated-service.interface').AuthenticatedService;
}
