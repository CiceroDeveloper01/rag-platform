import { registerAs } from "@nestjs/config";

export const internalApiConfig = registerAs("internalApi", () => ({
  baseUrl: process.env.INTERNAL_API_BASE_URL ?? "http://localhost:3001",
  timeoutMs: Number(process.env.INTERNAL_API_REQUEST_TIMEOUT_MS ?? 10_000),
  retryEnabled: process.env.HTTP_RETRY_ENABLED !== "false",
  retryMaxAttempts: Number(process.env.HTTP_RETRY_MAX_ATTEMPTS ?? 3),
  retryInitialDelayMs: Number(process.env.HTTP_RETRY_INITIAL_DELAY_MS ?? 250),
  retryMaxDelayMs: Number(process.env.HTTP_RETRY_MAX_DELAY_MS ?? 2_000),
  circuitBreakerEnabled:
    (process.env.HTTP_CIRCUIT_BREAKER_ENABLED ?? "true") === "true",
  circuitBreakerFailureThreshold: Number(
    process.env.HTTP_CIRCUIT_BREAKER_FAILURE_THRESHOLD ?? 5,
  ),
  circuitBreakerOpenMs: Number(
    process.env.HTTP_CIRCUIT_BREAKER_OPEN_MS ?? 30_000,
  ),
  paths: {
    requestDocumentIngestion:
      process.env.INTERNAL_API_INGESTION_REQUEST_PATH ?? "/ingestion/request",
    startDocumentIngestion:
      process.env.INTERNAL_API_INGESTION_START_PATH ?? "/ingestion/start",
    registerDocument:
      process.env.INTERNAL_API_DOCUMENTS_REGISTER_PATH ?? "/documents/register",
    completeDocumentIngestion:
      process.env.INTERNAL_API_INGESTION_COMPLETE_PATH ?? "/ingestion/complete",
    failDocumentIngestion:
      process.env.INTERNAL_API_INGESTION_FAIL_PATH ?? "/ingestion/fail",
    updateDocumentIngestionStatus:
      process.env.INTERNAL_API_INGESTION_STATUS_PATH ?? "/ingestion/status",
    replyConversation:
      process.env.INTERNAL_API_CONVERSATIONS_REPLY_PATH ??
      "/conversations/reply",
    handoff: process.env.INTERNAL_API_HANDOFF_PATH ?? "/handoff",
    search: process.env.INTERNAL_API_SEARCH_PATH ?? "/search",
    memoryStore:
      process.env.INTERNAL_API_MEMORY_STORE_PATH ?? "/memory/messages",
    memoryContext:
      process.env.INTERNAL_API_MEMORY_CONTEXT_PATH ?? "/memory/context",
    bankingCards: process.env.INTERNAL_API_BANKING_CARDS_PATH ?? "/banking/cards",
    bankingInvestments:
      process.env.INTERNAL_API_BANKING_INVESTMENTS_PATH ??
      "/banking/investments",
    bankingCustomer:
      process.env.INTERNAL_API_BANKING_CUSTOMER_PATH ?? "/banking/customer",
    bankingCredit:
      process.env.INTERNAL_API_BANKING_CREDIT_PATH ?? "/banking/credit",
  },
}));
