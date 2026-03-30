import { ChannelMessageEvent } from "@rag-platform/contracts";
import { SupportedAgentLanguage } from "../agents/language-detection.service";
import { DecisionResult } from "../decision-layer/decision.types";
import { RagDocumentRecord } from "../rag/vector.repository";

export interface SpecialistExecutionContext {
  message: ChannelMessageEvent;
  tenantId: string;
  detectedLanguage: SupportedAgentLanguage;
  decision: DecisionResult;
  queryEmbedding?: number[];
}

export interface SpecialistResult {
  responseText: string;
  llmContext?: string;
  usedRag: boolean;
  usedLlm?: boolean;
  retrievedDocuments: RagDocumentRecord[];
  toolCalls: string[];
  metadata?: Record<string, unknown>;
  handoffRequested?: boolean;
}
