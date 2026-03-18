export interface AuthenticatedService {
  type: 'service';
  subject: string;
  issuer: string;
  audience: string;
  scopes: string[];
  issuedAt: number;
  expiresAt: number;
}
