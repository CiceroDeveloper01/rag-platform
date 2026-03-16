import { Channel } from "@rag-platform/contracts";
import { WhatsAppInboundAdapter } from "./whatsapp.inbound.adapter";

describe("WhatsAppInboundAdapter", () => {
  it("maps a whatsapp webhook payload into an inbound message payload", () => {
    const adapter = new WhatsAppInboundAdapter();

    const payload = adapter.toInboundMessage({
      entry: [
        {
          changes: [
            {
              value: {
                metadata: {
                  phone_number_id: "phone-1",
                  display_phone_number: "+5511999999999",
                },
                contacts: [
                  {
                    wa_id: "5511999999999",
                    profile: {
                      name: "Maria",
                    },
                  },
                ],
                messages: [
                  {
                    id: "wamid.100",
                    from: "5511999999999",
                    timestamp: "1710000000",
                    text: {
                      body: "Oi, preciso de ajuda",
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(payload).toEqual(
      expect.objectContaining({
        channel: Channel.WHATSAPP,
        externalMessageId: "wamid.100",
        conversationId: "5511999999999",
        from: "Maria",
        body: "Oi, preciso de ajuda",
      }),
    );
    expect(payload?.metadata).toEqual(
      expect.objectContaining({
        whatsappUserId: "5511999999999",
        whatsappPhoneNumberId: "phone-1",
      }),
    );
  });

  it("returns null when the webhook does not include a text message", () => {
    const adapter = new WhatsAppInboundAdapter();

    expect(adapter.toInboundMessage({ entry: [] })).toBeNull();
  });
});
