import { Channel } from "@rag-platform/contracts";
import { EmailInboundAdapter } from "./email.inbound.adapter";
import { EmailListener } from "./email.listener";

describe("EmailListener", () => {
  it("starts in manual mode when enabled", async () => {
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
          "listeners.email.enabled": true,
          "listeners.email.mode": "manual",
        };

        return values[key] ?? defaultValue;
      }),
    } as any;
    const logger = { log: jest.fn(), warn: jest.fn() } as any;
    const queue = { enqueueReceivedMessage: jest.fn() } as any;
    const listener = new EmailListener(
      configService,
      new EmailInboundAdapter(),
      logger,
      queue,
    );

    await listener.start();

    expect(listener.channel).toBe(Channel.EMAIL);
    expect(logger.log).toHaveBeenCalled();
  });

  it("maps raw payloads before publishing to the inbound queue", async () => {
    const configService = { get: jest.fn() } as any;
    const logger = { log: jest.fn(), warn: jest.fn() } as any;
    const queue = {
      enqueueReceivedMessage: jest.fn().mockResolvedValue(undefined),
    } as any;
    const listener = new EmailListener(
      configService,
      new EmailInboundAdapter(),
      logger,
      queue,
    );

    await listener.receiveRaw({
      externalMessageId: "mail-77",
      fromEmail: "ops@rag.dev",
      body: "Need support",
    });

    expect(queue.enqueueReceivedMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: Channel.EMAIL,
        externalMessageId: "mail-77",
      }),
    );
  });
});
