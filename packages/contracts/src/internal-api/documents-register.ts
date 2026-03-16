import { z } from "zod";

export const documentsRegisterRequestSchema = z.object({
  tenantId: z.string().min(1),
  source: z.string().min(1),
  content: z.string().min(1),
  externalMessageId: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type DocumentsRegisterRequest = z.infer<
  typeof documentsRegisterRequestSchema
>;

export const documentsRegisterResponseSchema = z.object({
  success: z.boolean(),
  documentId: z.union([z.number(), z.string()]).optional(),
});

export type DocumentsRegisterResponse = z.infer<
  typeof documentsRegisterResponseSchema
>;
