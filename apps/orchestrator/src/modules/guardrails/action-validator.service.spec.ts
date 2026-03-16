import { ActionValidatorService } from "./action-validator.service";
import { SecurityEventLogger } from "./security-event.logger";

describe("ActionValidatorService", () => {
  it("accepts valid flow execution payloads", () => {
    const securityEventLogger = {
      log: jest.fn(),
    } as unknown as SecurityEventLogger;
    const service = new ActionValidatorService(securityEventLogger);

    expect(() =>
      service.assertValid({
        channel: "email" as never,
        externalMessageId: "msg-1",
        context: {
          body: "hello",
        },
      }),
    ).not.toThrow();
  });

  it("rejects invalid payloads and logs the issue", () => {
    const securityEventLogger = {
      log: jest.fn(),
    } as unknown as SecurityEventLogger;
    const service = new ActionValidatorService(securityEventLogger);

    expect(() =>
      service.assertValid({
        channel: "" as never,
        externalMessageId: "",
      }),
    ).toThrow("Flow execution payload blocked by validator");

    expect(securityEventLogger.log).toHaveBeenCalledWith(
      "invalid_payload",
      expect.objectContaining({
        payload: expect.objectContaining({
          externalMessageId: "",
        }),
      }),
    );
  });
});
