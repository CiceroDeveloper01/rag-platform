"use client";

import { optionalApiRequest } from "@/src/lib/api/api-client";
import { omnichannelService } from "@/src/features/omnichannel/services/omnichannel.service";
import type {
  ConversationChannel,
  ConversationDetail,
  ConversationFlowType,
  ConversationSummaryItem,
  ConversationWorkspace,
  HandoffItem,
} from "../types/operations.types";

const mockConversationSummaries: ConversationSummaryItem[] = [
  {
    id: "9001",
    sessionId: "conv-web-9001",
    channel: "WEB",
    customerName: "Ada Lovelace",
    tenantId: "banking-demo",
    status: "OPEN",
    domainContext: "cards",
    flowType: "sensitive-operation",
    lastMessage: "Perdi meu cartao e preciso bloquear agora.",
    lastActivityAt: "2026-03-30T14:20:00.000Z",
    source: "mock",
  },
  {
    id: "9002",
    sessionId: "conv-wa-9002",
    channel: "WHATSAPP",
    customerName: "Alan Turing",
    tenantId: "banking-demo",
    status: "RESOLVED",
    domainContext: "investments",
    flowType: "tool-only",
    lastMessage: "Quero simular 5 mil em CDB por 12 meses.",
    lastActivityAt: "2026-03-30T13:55:00.000Z",
    source: "mock",
  },
  {
    id: "9003",
    sessionId: "conv-tg-9003",
    channel: "TELEGRAM",
    customerName: "Grace Hopper",
    tenantId: "prime-ops",
    status: "HANDOFF",
    domainContext: "credit",
    flowType: "handoff",
    lastMessage: "Quero falar com um humano sobre renegociacao.",
    lastActivityAt: "2026-03-30T13:12:00.000Z",
    source: "mock",
  },
];

const mockDetails: Record<string, ConversationDetail> = {
  "9001": {
    summary: mockConversationSummaries[0],
    timeline: [
      {
        id: "t1",
        role: "customer",
        content: "Perdi meu cartao e preciso bloquear agora.",
        timestamp: "2026-03-30T14:18:00.000Z",
      },
      {
        id: "t2",
        role: "platform",
        content: "Entendi. Antes de bloquear, preciso da sua confirmacao.",
        timestamp: "2026-03-30T14:18:02.000Z",
      },
      {
        id: "t3",
        role: "customer",
        content: "confirmo",
        timestamp: "2026-03-30T14:19:00.000Z",
      },
      {
        id: "t4",
        role: "platform",
        content: "Bloqueio solicitado com sucesso para o cartao final 4432.",
        timestamp: "2026-03-30T14:19:02.000Z",
      },
    ],
    intent: "CARD_SERVICES",
    specialist: "CardSpecialist",
    tools: ["GetCardInfoTool", "BlockCardTool"],
    handoffRequested: false,
    pendingConfirmation: false,
    correlationId: "corr-cards-9001",
    latencyMs: 182,
    metadataSource: "mock",
  },
  "9002": {
    summary: mockConversationSummaries[1],
    timeline: [
      {
        id: "t1",
        role: "customer",
        content: "Quero simular 5 mil em CDB por 12 meses.",
        timestamp: "2026-03-30T13:54:30.000Z",
      },
      {
        id: "t2",
        role: "platform",
        content: "Para um CDB com taxa anual de 11,8%, o valor projetado fica em R$ 5.590,00.",
        timestamp: "2026-03-30T13:54:31.000Z",
      },
    ],
    intent: "INVESTMENT_ADVISORY",
    specialist: "InvestmentSpecialist",
    tools: ["SimulateInvestmentTool"],
    handoffRequested: false,
    pendingConfirmation: false,
    correlationId: "corr-invest-9002",
    latencyMs: 96,
    metadataSource: "mock",
  },
  "9003": {
    summary: mockConversationSummaries[2],
    timeline: [
      {
        id: "t1",
        role: "customer",
        content: "Quero falar com um humano sobre renegociacao.",
        timestamp: "2026-03-30T13:10:00.000Z",
      },
      {
        id: "t2",
        role: "platform",
        content: "Vou encaminhar seu atendimento para um especialista humano.",
        timestamp: "2026-03-30T13:10:03.000Z",
      },
    ],
    intent: "HUMAN_HANDOFF",
    specialist: "DebtSpecialist",
    tools: [],
    handoffRequested: true,
    pendingConfirmation: false,
    correlationId: "corr-handoff-9003",
    latencyMs: 121,
    metadataSource: "mock",
  },
};

const mockHandoffs: HandoffItem[] = [
  {
    id: "handoff-001",
    channel: "TELEGRAM",
    customerName: "Grace Hopper",
    queue: "banking-specialists",
    reason: "Renegociacao e necessidade de atendimento humano",
    requestedAt: "2026-03-30T13:10:03.000Z",
    status: "processing",
    source: "mock",
  },
  {
    id: "handoff-002",
    channel: "WHATSAPP",
    customerName: "Katherine Johnson",
    queue: "priority-care",
    reason: "Operacao sensivel sem contexto suficiente",
    requestedAt: "2026-03-30T11:42:11.000Z",
    status: "requested",
    source: "mock",
  },
];

function mapChannel(channel: string): ConversationChannel {
  const normalized = channel.toUpperCase();
  if (normalized === "WHATSAPP") {
    return "WHATSAPP";
  }
  if (normalized === "TELEGRAM") {
    return "TELEGRAM";
  }
  return "WEB";
}

function inferFlowType(item: {
  usedRag?: boolean;
  status?: string;
  normalizedTextPreview?: string;
}): ConversationFlowType {
  const preview = item.normalizedTextPreview?.toLowerCase() ?? "";

  if (preview.includes("humano") || preview.includes("human")) {
    return "handoff";
  }

  if (
    preview.includes("bloquear") ||
    preview.includes("perdi") ||
    preview.includes("lost card")
  ) {
    return "sensitive-operation";
  }

  if (item.usedRag) {
    return "knowledge-assisted";
  }

  return "tool-only";
}

function summarize(items: ConversationSummaryItem[]): ConversationWorkspace["highlighted"] {
  const byChannel: Record<ConversationChannel, number> = {
    WEB: 0,
    WHATSAPP: 0,
    TELEGRAM: 0,
  };

  items.forEach((item) => {
    byChannel[item.channel] += 1;
  });

  const handoffs = items.filter((item) => item.flowType === "handoff").length;
  const toolOnly = items.filter((item) => item.flowType === "tool-only").length;

  return {
    total: items.length,
    byChannel,
    handoffs,
    toolOnlyRate: items.length ? Math.round((toolOnly / items.length) * 100) : 0,
  };
}

function asIsoString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value ?? new Date().toISOString());
}

function getMetadataValue(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
) {
  return metadata?.[key];
}

export const operationsApiService = {
  async getConversationsWorkspace(): Promise<ConversationWorkspace> {
    try {
      const response = await omnichannelService.listRequests({
        limit: 12,
        offset: 0,
        sortOrder: "desc",
      });

      const conversations = response.items.map((item) => ({
        id: String(item.id),
        sessionId: item.conversationId ?? `session-${String(item.id)}`,
        channel: mapChannel(item.channel),
        customerName: item.senderName ?? item.senderAddress ?? "Cliente sem nome",
        tenantId: "default",
        status: item.status,
        domainContext: "banking",
        flowType: inferFlowType(item),
        lastMessage: item.normalizedTextPreview,
        lastActivityAt: asIsoString(item.processedAt ?? item.receivedAt),
        source: "api" as const,
      }));

      return {
        conversations,
        highlighted: summarize(conversations),
        source: "api",
      };
    } catch {
      return {
        conversations: mockConversationSummaries,
        highlighted: summarize(mockConversationSummaries),
        source: "mock",
      };
    }
  },

  async getConversationDetail(id: string): Promise<ConversationDetail> {
    try {
      const numericId = Number(id);
      if (!Number.isNaN(numericId)) {
        const details = await omnichannelService.getRequestDetails(numericId);
        const summary: ConversationSummaryItem = {
          id: String(details.message.id),
          sessionId: details.message.conversationId
            ? details.message.conversationId
            : getMetadataValue(details.message.metadata, "conversationId")
              ? String(getMetadataValue(details.message.metadata, "conversationId"))
              : `session-${String(details.message.id)}`,
          channel: mapChannel(details.message.channel),
          customerName:
            details.message.senderName ??
            details.message.senderAddress ??
            "Cliente sem nome",
          tenantId: String(getMetadataValue(details.message.metadata, "tenantId") ?? "default"),
          status: details.message.status,
          domainContext: "banking",
          flowType: details.execution?.status === "FAILED"
            ? "handoff"
            : details.execution?.usedRag
              ? "knowledge-assisted"
              : "tool-only",
          lastMessage: details.message.normalizedText,
          lastActivityAt: asIsoString(
            details.message.processedAt ?? details.message.receivedAt,
          ),
          source: "api",
        };

        return {
          summary,
          timeline: [
            {
              id: "msg",
              role: "customer",
              content: details.message.body,
              timestamp: asIsoString(details.message.receivedAt),
            },
            {
              id: "sys",
              role: "system",
              content:
                details.execution?.status === "FAILED"
                  ? details.execution.errorMessage ?? "Falha operacional registrada."
                  : "Execucao acompanhada pela camada omnichannel.",
              timestamp:
                asIsoString(
                  details.message.processedAt ?? details.message.receivedAt,
                ),
            },
          ],
          intent: String(getMetadataValue(details.message.metadata, "intent") ?? "n/a"),
          specialist: details.execution?.agentName ?? "n/a",
          tools: Array.isArray(getMetadataValue(details.message.metadata, "tools"))
            ? (getMetadataValue(details.message.metadata, "tools") as string[])
            : [],
          handoffRequested:
            String(getMetadataValue(details.message.metadata, "handoffRequested") ?? "false") === "true",
          pendingConfirmation:
            String(getMetadataValue(details.message.metadata, "pendingConfirmation") ?? "false") === "true",
          correlationId:
            String(getMetadataValue(details.message.metadata, "correlationId") ?? details.message.id),
          latencyMs: details.execution?.latencyMs ?? undefined,
          metadataSource: "backend",
        };
      }
    } catch {
      // fallback below
    }

    return mockDetails[id] ?? mockDetails["9001"];
  },

  async listHandoffs(): Promise<{ items: HandoffItem[]; source: "api" | "mock" }> {
    try {
      const response = await optionalApiRequest<Array<Record<string, unknown>>>(
        "/handoffs",
      );

      if (response) {
        const items = response.map((item) => ({
          id: String(item.id),
          channel: mapChannel(String(item.channel ?? "WEB")),
          customerName: String(item.customerName ?? "Cliente"),
          queue: String(item.queue ?? "handoff"),
          reason: String(item.reason ?? "Atendimento especializado"),
          requestedAt: String(item.requestedAt ?? new Date().toISOString()),
          status: (item.status as HandoffItem["status"]) ?? "requested",
          source: "api" as const,
        }));

        return { items, source: "api" };
      }
    } catch {
      // fallback below
    }

    return { items: mockHandoffs, source: "mock" };
  },
};
