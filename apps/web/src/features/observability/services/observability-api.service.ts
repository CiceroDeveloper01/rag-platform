import { appLinks } from "@/src/lib/constants/app";
import { apiRequest } from "@/src/lib/api/api-client";
import type {
  HealthResponse,
  ObservabilityLinks,
} from "../types/observability.types";

export const observabilityApiService = {
  async getHealth() {
    return apiRequest<HealthResponse>("/health");
  },
  getLinks(): ObservabilityLinks {
    return {
      apiHealth: appLinks.apiHealth,
      apiMetrics: appLinks.apiMetrics,
      prometheus: appLinks.prometheus,
      grafana: appLinks.grafana,
    };
  },
};
