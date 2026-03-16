import { PolicyEngineService } from "./policy-engine.service";
import { SecurityEventLogger } from "./security-event.logger";

describe("PolicyEngineService", () => {
  it("allows actions that match the policy map", () => {
    const securityEventLogger = {
      log: jest.fn(),
    } as unknown as SecurityEventLogger;
    const service = new PolicyEngineService(securityEventLogger);

    expect(() =>
      service.assertAuthorized(
        "conversation-agent",
        "execute.reply-conversation",
      ),
    ).not.toThrow();
  });

  it("blocks actions outside the policy map and logs the violation", () => {
    const securityEventLogger = {
      log: jest.fn(),
    } as unknown as SecurityEventLogger;
    const service = new PolicyEngineService(securityEventLogger);

    expect(() =>
      service.assertAuthorized("document-agent", "execute.handoff"),
    ).toThrow("Agent action blocked by policy engine");

    expect(securityEventLogger.log).toHaveBeenCalledWith(
      "policy_violation",
      expect.objectContaining({
        agent: "document-agent",
        attemptedAction: "execute.handoff",
      }),
    );
  });
});
