export interface UserAccessTokenPayload extends Record<string, unknown> {
  type: 'user';
  iss: string;
  aud: string;
  sub: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  scopes: string[];
  iat: number;
  exp: number;
}
