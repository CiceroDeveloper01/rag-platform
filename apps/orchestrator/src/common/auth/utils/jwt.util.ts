import { createHmac } from "node:crypto";

type JwtPayload = Record<string, unknown> & {
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  sub?: string;
};

function encodeBase64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function signHs256Jwt<TPayload extends JwtPayload>(
  payload: TPayload,
  secret: string,
) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();

  return `${encodedHeader}.${encodedPayload}.${encodeBase64Url(signature)}`;
}
