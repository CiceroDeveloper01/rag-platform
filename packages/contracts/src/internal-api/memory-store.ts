import { z } from "zod";

const memoryRoleSchema = z.enum(["user", "assistant", "system"]);

export const memoryStoreRequestSchema = z.object({
  tenantId: z.string().min(1),
  channel: z.string().min(1),
  conversationId: z.string().min(1),
  role: memoryRoleSchema,
  message: z.string().min(1),
  embedding: z.array(z.number()),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().optional(),
});

export type MemoryStoreRequest = z.infer<typeof memoryStoreRequestSchema>;

export const memoryStoreResponseSchema = z.object({
  success: z.boolean(),
  memoryId: z.union([z.number(), z.string()]).optional(),
});

export type MemoryStoreResponse = z.infer<typeof memoryStoreResponseSchema>;
