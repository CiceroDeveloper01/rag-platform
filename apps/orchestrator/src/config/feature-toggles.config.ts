import { registerAs } from "@nestjs/config";

const asBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return value === "true";
};

export const featureTogglesConfig = registerAs("features", () => ({
  documentIngestionEnabled: asBoolean(
    process.env.DOCUMENT_INGESTION_ENABLED,
    true,
  ),
  documentParsingEnabled: asBoolean(process.env.DOCUMENT_PARSING_ENABLED, true),
  ragRetrievalEnabled: asBoolean(process.env.RAG_RETRIEVAL_ENABLED, true),
  conversationMemoryEnabled: asBoolean(
    process.env.CONVERSATION_MEMORY_ENABLED,
    true,
  ),
  evaluationEnabled: asBoolean(process.env.EVALUATION_ENABLED, true),
  outboundSendingEnabled: asBoolean(process.env.OUTBOUND_SENDING_ENABLED, true),
}));
