export interface InternalServiceTokenPayload extends Record<string, unknown> {
  type: 'service';
  iss: string;
  aud: string;
  sub: string;
  scope: string;
  iat: number;
  exp: number;
}
