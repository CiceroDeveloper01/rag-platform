import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ExecutionContext } from "@nestjs/common";
import { SessionAuthGuard } from "./session-auth.guard";

describe("SessionAuthGuard", () => {
  const authService = {
    validateSession: jest.fn(),
  };
  const userAccessTokenService = {
    verifyToken: jest.fn(),
  };
  const configService = new ConfigService({
    auth: {
      sessionCookieName: "rag_platform_session",
    },
  });

  const guard = new SessionAuthGuard(
    authService as never,
    configService,
    userAccessTokenService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("accepts bearer user JWTs at the edge", async () => {
    const request = {
      headers: {
        authorization: "Bearer edge-user-token",
      },
    };
    userAccessTokenService.verifyToken.mockReturnValue({
      id: 7,
      email: "edge@example.com",
      fullName: "Edge User",
      role: "admin",
      scopes: ["documents:read"],
    });

    await expect(canActivate(guard, request)).resolves.toBe(true);
    expect(userAccessTokenService.verifyToken).toHaveBeenCalledWith(
      "edge-user-token",
    );
    expect(request).toMatchObject({
      user: {
        id: 7,
        email: "edge@example.com",
      },
    });
  });

  it("falls back to session cookies when bearer auth is absent", async () => {
    const request = {
      headers: {
        cookie: "rag_platform_session=session-123",
      },
    };
    authService.validateSession.mockResolvedValue({
      id: 5,
      email: "cookie@example.com",
      fullName: "Cookie User",
      role: "user",
      scopes: ["documents:read"],
    });

    await expect(canActivate(guard, request)).resolves.toBe(true);
    expect(authService.validateSession).toHaveBeenCalledWith("session-123");
    expect(request).toMatchObject({
      authSessionToken: "session-123",
      user: {
        id: 5,
      },
    });
  });

  it("rejects requests without bearer or valid session", async () => {
    await expect(canActivate(guard, { headers: {} })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

async function canActivate(
  guard: SessionAuthGuard,
  request: Record<string, unknown>,
) {
  return guard.canActivate({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext);
}
