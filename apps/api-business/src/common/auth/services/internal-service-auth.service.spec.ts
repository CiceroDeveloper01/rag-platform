import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { createHmac } from "node:crypto";
import { InternalServiceAuthService } from "./internal-service-auth.service";

describe("InternalServiceAuthService", () => {
  const configService = new ConfigService({
    security: {
      internalService: {
        secret: "test-secret",
        issuer: "rag-platform-internal",
        audience: "rag-platform-api-business",
        allowedSubjects: ["service-api-web", "service-orchestrator"],
        clockSkewSeconds: 30,
      },
    },
  });
  const service = new InternalServiceAuthService(configService);

  it("validates a signed internal service token", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signJwt(
      {
        type: "service",
        iss: "rag-platform-internal",
        aud: "rag-platform-api-business",
        sub: "service-api-web",
        scope: "business:documents:read business:documents:write",
        iat: now,
        exp: now + 300,
      },
    );

    expect(service.verifyToken(token)).toMatchObject({
      subject: "service-api-web",
      scopes: ["business:documents:read", "business:documents:write"],
    });
  });

  it("rejects internal tokens from disallowed subjects", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signJwt(
      {
        type: "service",
        iss: "rag-platform-internal",
        aud: "rag-platform-api-business",
        sub: "service-unknown",
        scope: "business:documents:read",
        iat: now,
        exp: now + 300,
      },
    );

    expect(() => service.verifyToken(token)).toThrow(UnauthorizedException);
  });
});

function signJwt(payload: Record<string, unknown>) {
  const encodeBase64Url = (value: Buffer | string) =>
    Buffer.from(value)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

  const header = encodeBase64Url(
    JSON.stringify({
      alg: "HS256",
      typ: "JWT",
    }),
  );
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = encodeBase64Url(
    createHmac("sha256", "test-secret")
      .update(`${header}.${body}`)
      .digest(),
  );

  return `${header}.${body}.${signature}`;
}
