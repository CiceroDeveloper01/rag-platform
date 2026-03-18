import { ConfigService } from "@nestjs/config";
import { InternalServiceTokenService } from "./internal-service-token.service";

describe("InternalServiceTokenService", () => {
  it("issues a signed internal JWT for api-business calls", () => {
    const service = new InternalServiceTokenService(
      new ConfigService({
        security: {
          internalService: {
            secret: "orchestrator-secret",
            issuer: "rag-platform-internal",
            audience: "rag-platform-api-business",
            subject: "service-orchestrator",
            defaultScopes: ["internal:ingestion:write"],
            ttlSeconds: 300,
          },
        },
      }),
    );

    const token = service.issueToken();
    const [, encodedPayload] = token.split(".");
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8"),
    ) as Record<string, unknown>;

    expect(payload).toMatchObject({
      type: "service",
      iss: "rag-platform-internal",
      aud: "rag-platform-api-business",
      sub: "service-orchestrator",
      scope: "internal:ingestion:write",
    });
  });
});
