import { z } from "zod";

const memoryRoleSchema = z.enum(["user", "assistant", "system"]);

export const memoryContextEntrySchema = z.object({
  id: z.union([z.number(), z.string()]),
  tenantId: z.string().min(1),
  channel: z.string().min(1),
  conversationId: z.string().min(1),
  role: memoryRoleSchema,
  message: z.string().min(1),
  createdAt: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  similarity: z.number().optional(),
});

export type MemoryContextEntry = z.infer<typeof memoryContextEntrySchema>;

export const memoryQueryRequestSchema = z.object({
  tenantId: z.string().min(1),
  channel: z.string().min(1),
  conversationId: z.string().min(1),
  queryEmbedding: z.array(z.number()),
  recentLimit: z.number().int().min(1).max(50).optional(),
  semanticLimit: z.number().int().min(1).max(20).optional(),
  now: z.string().optional(),
});

export type MemoryQueryRequest = z.infer<typeof memoryQueryRequestSchema>;

export const memoryQueryResponseSchema = z.object({
  recentMessages: z.array(memoryContextEntrySchema),
  semanticMemories: z.array(memoryContextEntrySchema),
});

export type MemoryQueryResponse = z.infer<typeof memoryQueryResponseSchema>;
