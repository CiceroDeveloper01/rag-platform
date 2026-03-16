import { z } from "zod";

export const conversationsReplyRequestSchema = z.object({
  tenantId: z.string().min(1),
  channel: z.string().min(1),
  externalMessageId: z.string().min(1),
  message: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ConversationsReplyRequest = z.infer<
  typeof conversationsReplyRequestSchema
>;

export const conversationsReplyResponseSchema = z.object({
  success: z.boolean(),
  conversationId: z.union([z.number(), z.string()]).optional(),
});

export type ConversationsReplyResponse = z.infer<
  typeof conversationsReplyResponseSchema
>;
