import { documentsApiService } from "@/src/features/documents/services/documents-api.service";
import { conversationsApiService } from "@/src/features/chat/services/conversations-api.service";
import { observabilityApiService } from "@/src/features/observability/services/observability-api.service";
import type { DashboardOverview } from "../types/dashboard.types";

export const dashboardApiService = {
  async getOverview(): Promise<DashboardOverview> {
    const [health, documentsResponse, conversationsResponse] =
      await Promise.allSettled([
        observabilityApiService.getHealth(),
        documentsApiService.listDocuments(),
        conversationsApiService.listConversations(),
      ]);

    const conversations =
      conversationsResponse.status === "fulfilled"
        ? conversationsResponse.value.conversations
        : [];
    const documents =
      documentsResponse.status === "fulfilled"
        ? documentsResponse.value.items.slice(0, 6)
        : [];

    return {
      health: health.status === "fulfilled" ? health.value : null,
      documents,
      documentsSource:
        documentsResponse.status === "fulfilled"
          ? documentsResponse.value.source
          : "local",
      hasDocumentsEndpoint:
        documentsResponse.status === "fulfilled" &&
        documentsResponse.value.source === "api",
      queryCount: null,
      conversationsCount: conversations.length,
      recentActivity: [
        ...documents.slice(0, 3).map((document) => ({
          id: `document-${document.id}`,
          title: document.filename,
          subtitle: `Documento ${document.type} ingerido em ${new Date(document.createdAt).toLocaleDateString("pt-BR")}`,
        })),
        ...conversations.slice(0, 3).map((conversation) => ({
          id: `conversation-${conversation.id}`,
          title: conversation.title,
          subtitle: `Conversa atualizada em ${new Date(conversation.updatedAt).toLocaleDateString("pt-BR")}`,
        })),
      ].slice(0, 5),
    };
  },
};
