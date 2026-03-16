import { Channel } from "@rag-platform/contracts";
import { WhatsAppInboundAdapter } from "../inbound/whatsapp.inbound.adapter";
import { WhatsAppListener } from "./whatsapp.listener";

describe("WhatsAppListener", () => {
  it("starts in manual mode when enabled", async () => {
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const values: Record<string, unknown> = {
          "listeners.whatsapp.enabled": true,
          "listeners.whatsapp.mode": "manual",
        };

        return values[key] ?? defaultValue;
      }),
    } as any;
    const logger = { log: jest.fn(), warn: jest.fn() } as any;
    const queue = { enqueueReceivedMessage: jest.fn() } as any;
    const listener = new WhatsAppListener(
      configService,
      new WhatsAppInboundAdapter(),
      logger,
      queue,
    );

    await listener.start();

    expect(listener.channel).toBe(Channel.WHATSAPP);
    expect(logger.log).toHaveBeenCalled();
  });

  it("maps raw payloads before publishing to the inbound queue", async () => {
    const configService = { get: jest.fn() } as any;
    const logger = { log: jest.fn(), warn: jest.fn() } as any;
    const queue = {
      enqueueReceivedMessage: jest.fn().mockResolvedValue(undefined),
    } as any;
    const listener = new WhatsAppListener(
      configService,
      new WhatsAppInboundAdapter(),
      logger,
      queue,
    );

    await listener.receiveRaw({
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: "wamid.55",
                    from: "55110001111",
                    timestamp: "1710000000",
                    text: { body: "Hello from WhatsApp" },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(queue.enqueueReceivedMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: Channel.WHATSAPP,
        externalMessageId: "wamid.55",
      }),
    );
  });
});
