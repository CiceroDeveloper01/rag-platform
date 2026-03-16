import { Channel } from "@rag-platform/contracts";
import { ChannelOutboundRouterService } from "./channel-outbound-router.service";

describe("ChannelOutboundRouterService", () => {
  it("routes outbound messages to the matching channel service", async () => {
    const emailOutboundService = {
      channel: Channel.EMAIL,
      sendMessage: jest.fn(),
    };
    const telegramOutboundService = {
      channel: Channel.TELEGRAM,
      sendMessage: jest.fn(),
    };
    const whatsappOutboundService = {
      channel: Channel.WHATSAPP,
      sendMessage: jest.fn(),
    };
    const service = new ChannelOutboundRouterService(
      emailOutboundService as any,
      telegramOutboundService as any,
      whatsappOutboundService as any,
    );

    await service.send(Channel.TELEGRAM, {
      recipientId: "1001",
      text: "hello",
    });

    expect(telegramOutboundService.sendMessage).toHaveBeenCalledWith({
      recipientId: "1001",
      text: "hello",
    });
  });

  it("throws when no outbound service exists for the requested channel", async () => {
    const service = new ChannelOutboundRouterService(
      { channel: Channel.EMAIL, sendMessage: jest.fn() } as any,
      { channel: Channel.TELEGRAM, sendMessage: jest.fn() } as any,
      { channel: Channel.WHATSAPP, sendMessage: jest.fn() } as any,
    );

    await expect(
      service.send("voice" as any, {
        recipientId: "1001",
        text: "hello",
      }),
    ).rejects.toThrow("No outbound service registered for channel voice");
  });
});
