import type { DocumentListItem } from "@/src/features/documents/types/documents.types";
import type { HealthResponse } from "@/src/features/observability/types/observability.types";

export interface DashboardMetrics {
  documentsCount: number;
  conversationsCount: number;
  queriesProcessed: number | null;
}

export interface DashboardOverview {
  health: HealthResponse | null;
  documents: DocumentListItem[];
  documentsSource: "api" | "local";
  hasDocumentsEndpoint: boolean;
  queryCount: number | null;
  conversationsCount: number;
  recentActivity: Array<{
    id: string;
    title: string;
    subtitle: string;
  }>;
}
