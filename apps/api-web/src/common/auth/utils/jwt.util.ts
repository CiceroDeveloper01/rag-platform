import { createHmac, timingSafeEqual } from 'crypto';

type JwtPayload = Record<string, unknown> & {
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  sub?: string;
};

type VerifiedJwt<TPayload extends JwtPayload> = {
  payload: TPayload;
  header: Record<string, unknown>;
};

function encodeBase64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));

  return Buffer.from(`${normalized}${padding}`, 'base64');
}

export function signHs256Jwt<TPayload extends JwtPayload>(
  payload: TPayload,
  secret: string,
) {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();

  return `${encodedHeader}.${encodedPayload}.${encodeBase64Url(signature)}`;
}

export function verifyHs256Jwt<TPayload extends JwtPayload>(
  token: string,
  secret: string,
): VerifiedJwt<TPayload> {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error('jwt_malformed');
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const actualSignature = decodeBase64Url(encodedSignature);

  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    throw new Error('jwt_invalid_signature');
  }

  const header = JSON.parse(
    decodeBase64Url(encodedHeader).toString('utf-8'),
  ) as Record<string, unknown>;
  const payload = JSON.parse(
    decodeBase64Url(encodedPayload).toString('utf-8'),
  ) as TPayload;

  return { header, payload };
}
