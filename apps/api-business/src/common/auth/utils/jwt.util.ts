import { createHmac, timingSafeEqual } from 'crypto';

type JwtPayload = Record<string, unknown>;

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));

  return Buffer.from(`${normalized}${padding}`, 'base64');
}

export function verifyHs256Jwt<TPayload extends JwtPayload>(
  token: string,
  secret: string,
) {
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

  return JSON.parse(decodeBase64Url(encodedPayload).toString('utf-8')) as TPayload;
}
