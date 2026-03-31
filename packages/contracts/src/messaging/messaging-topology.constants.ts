import { withRetryAndDeadLetter } from "./messaging-topology.helper";
import {
  MessagingBindingDefinition,
  MessagingNamingConvention,
} from "./messaging-topology.types";

const defineBinding = (
  exchange: string,
  queue: string,
  routingKey: string,
  description: string,
): MessagingBindingDefinition => ({
  exchange,
  queue,
  routingKey,
  description,
});

export const MESSAGING_NAMING_CONVENTIONS: MessagingNamingConvention = {
  exchangePattern: "<domain> or <domain>.<subdomain>",
  routingKeyPattern: "<action>.<state>",
  queuePattern: "<exchange>.<action>-<state>",
  notes: [
    "Exchanges are grouped by runtime domain or business subdomain.",
    "Routing keys describe the action being requested or produced.",
    "Queues are named for the consumer workload and stay explicit.",
    "Current document ingestion keeps a legacy-compatible binding until migration.",
  ],
};

export const CANONICAL_MESSAGING_TOPOLOGY = {
  orchestrator: {
    inboundMessage: defineBinding(
      "orchestrator",
      "orchestrator.inbound-message",
      "inbound-message.requested",
      "Inbound orchestrator work accepted from channels or adapters.",
    ),
    supervisorDecision: defineBinding(
      "orchestrator",
      "orchestrator.supervisor-decision",
      "supervisor-decision.requested",
      "Supervisor routing and decision work.",
    ),
    specialistExecution: defineBinding(
      "orchestrator",
      "orchestrator.specialist-execution",
      "specialist-execution.requested",
      "Specialist execution workload after intent routing.",
    ),
    replyDispatch: defineBinding(
      "orchestrator",
      "orchestrator.reply-dispatch",
      "reply-dispatch.requested",
      "Final outbound dispatch workload for orchestrator replies.",
    ),
  },
  handoff: {
    requested: defineBinding(
      "handoff",
      "handoff.requested",
      "requested",
      "Handoff requests emitted by orchestrated flows.",
    ),
    processing: defineBinding(
      "handoff",
      "handoff.processing",
      "processing",
      "Handoff processing workload.",
    ),
    completed: defineBinding(
      "handoff",
      "handoff.completed",
      "completed",
      "Handoff completion events.",
    ),
  },
  ingestion: {
    documentRequested: defineBinding(
      "ingestion",
      "ingestion.document-requested",
      "document.requested",
      "Document ingestion accepted for asynchronous processing.",
    ),
    documentParsing: defineBinding(
      "ingestion",
      "ingestion.document-parsing",
      "document.parsing",
      "Document parsing stage.",
    ),
    documentChunking: defineBinding(
      "ingestion",
      "ingestion.document-chunking",
      "document.chunking",
      "Document chunking stage.",
    ),
    documentEmbedding: defineBinding(
      "ingestion",
      "ingestion.document-embedding",
      "document.embedding",
      "Document embedding generation stage.",
    ),
    documentIndexing: defineBinding(
      "ingestion",
      "ingestion.document-indexing",
      "document.indexing",
      "Vector or search indexing stage.",
    ),
    documentFailed: defineBinding(
      "ingestion",
      "ingestion.document-failed",
      "document.failed",
      "Terminal ingestion failures.",
    ),
  },
  memory: {
    storeRequested: defineBinding(
      "memory",
      "memory.store-requested",
      "store.requested",
      "Persist conversation or working memory.",
    ),
    contextQuery: defineBinding(
      "memory",
      "memory.context-query",
      "context.query",
      "Query contextual memory for runtime assembly.",
    ),
    enrichment: defineBinding(
      "memory",
      "memory.enrichment",
      "enrichment.requested",
      "Memory enrichment or augmentation pipeline.",
    ),
  },
  banking: {
    cards: {
      blockRequested: defineBinding(
        "banking.cards",
        "banking.cards.block-requested",
        "block.requested",
        "Card block execution request.",
      ),
      unblockRequested: defineBinding(
        "banking.cards",
        "banking.cards.unblock-requested",
        "unblock.requested",
        "Card unblock execution request.",
      ),
    },
    investments: {
      simulationRequested: defineBinding(
        "banking.investments",
        "banking.investments.simulation-requested",
        "simulation.requested",
        "Investment simulation request.",
      ),
      orderRequested: defineBinding(
        "banking.investments",
        "banking.investments.order-requested",
        "order.requested",
        "Investment order request.",
      ),
    },
    credit: {
      simulationRequested: defineBinding(
        "banking.credit",
        "banking.credit.simulation-requested",
        "simulation.requested",
        "Credit simulation request.",
      ),
      proposalRequested: defineBinding(
        "banking.credit",
        "banking.credit.proposal-requested",
        "proposal.requested",
        "Credit proposal request.",
      ),
    },
  },
} as const;

export const ACTIVE_MESSAGING_TOPOLOGY = {
  ingestion: {
    documentRequested: withRetryAndDeadLetter(
      defineBinding(
        "documents.ingestion",
        "document.ingestion.requested",
        "document.ingestion.requested",
        "Legacy-compatible active ingestion topology used by api-business and orchestrator today.",
      ),
    ),
  },
} as const;
