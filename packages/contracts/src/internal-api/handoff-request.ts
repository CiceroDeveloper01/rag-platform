import { z } from "zod";

export const handoffRequestSchema = z.object({
  channel: z.string().min(1),
  externalMessageId: z.string().min(1),
  reason: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type HandoffRequest = z.infer<typeof handoffRequestSchema>;

export const handoffResponseSchema = z.object({
  success: z.boolean(),
  handoffId: z.union([z.number(), z.string()]).optional(),
});

export type HandoffResponse = z.infer<typeof handoffResponseSchema>;
