import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ExecutionContext } from "@nestjs/common";
import { SessionOrInternalAuthGuard } from "./session-or-internal-auth.guard";

describe("SessionOrInternalAuthGuard", () => {
  const authService = {
    validateSession: jest.fn(),
  };
  const internalServiceAuthService = {
    verifyToken: jest.fn(),
  };
  const configService = new ConfigService({
    auth: {
      sessionCookieName: "rag_platform_session",
    },
  });
  const guard = new SessionOrInternalAuthGuard(
    authService as never,
    configService,
    internalServiceAuthService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("accepts internal bearer tokens for service-to-service requests", async () => {
    const request = {
      headers: {
        authorization: "Bearer internal-token",
      },
    };
    internalServiceAuthService.verifyToken.mockReturnValue({
      subject: "service-api-web",
      scopes: ["business:documents:read"],
    });

    await expect(canActivate(guard, request)).resolves.toBe(true);
    expect(internalServiceAuthService.verifyToken).toHaveBeenCalledWith(
      "internal-token",
    );
    expect(request).toMatchObject({
      service: {
        subject: "service-api-web",
      },
    });
  });

  it("falls back to user session auth for compatible business routes", async () => {
    const request = {
      headers: {
        cookie: "rag_platform_session=session-456",
      },
    };
    authService.validateSession.mockResolvedValue({
      id: 11,
      email: "user@example.com",
      fullName: "Business User",
      role: "user",
    });

    await expect(canActivate(guard, request)).resolves.toBe(true);
    expect(authService.validateSession).toHaveBeenCalledWith("session-456");
    expect(request).toMatchObject({
      authSessionToken: "session-456",
      user: {
        id: 11,
      },
    });
  });

  it("rejects requests without internal bearer or valid session", async () => {
    await expect(canActivate(guard, { headers: {} })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

async function canActivate(
  guard: SessionOrInternalAuthGuard,
  request: Record<string, unknown>,
) {
  return guard.canActivate({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext);
}
