import { ForbiddenException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { ScopesGuard } from "./scopes.guard";

describe("ScopesGuard", () => {
  it("allows requests when the user has all required scopes", () => {
    const guard = new ScopesGuard({
      getAllAndOverride: jest.fn().mockReturnValue(["documents:read"]),
    } as never);

    expect(
      guard.canActivate(
        buildContext({
          user: {
            scopes: ["documents:read", "auth:read"],
          },
        }),
      ),
    ).toBe(true);
  });

  it("allows admin wildcard scopes", () => {
    const guard = new ScopesGuard({
      getAllAndOverride: jest.fn().mockReturnValue(["documents:write"]),
    } as never);

    expect(
      guard.canActivate(
        buildContext({
          user: {
            scopes: ["admin:*"],
          },
        }),
      ),
    ).toBe(true);
  });

  it("rejects insufficient user scopes", () => {
    const guard = new ScopesGuard({
      getAllAndOverride: jest.fn().mockReturnValue(["documents:write"]),
    } as never);

    expect(() =>
      guard.canActivate(
        buildContext({
          user: {
            scopes: ["documents:read"],
          },
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});

function buildContext(request: Record<string, unknown>) {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}
