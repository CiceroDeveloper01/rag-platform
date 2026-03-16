import { z } from "zod";

export const supervisorDecisionSchema = z.object({
  route: z.enum(["document-agent", "conversation-agent", "handoff-agent"]),
  reason: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export type SupervisorDecision = z.infer<typeof supervisorDecisionSchema>;
