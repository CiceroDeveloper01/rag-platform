import { z } from "zod";

export const inboundMessageEventSchema = z.object({
  channel: z.enum(["email", "telegram", "whatsapp"]),
  externalMessageId: z.string().min(1),
  message: z.string().min(1),
  receivedAt: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type InboundMessageEvent = z.infer<typeof inboundMessageEventSchema>;
