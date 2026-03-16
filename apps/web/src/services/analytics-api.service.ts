import { apiRequest } from "@/src/lib/api/api-client";

export interface AgentQualityResponse {
  averageQualityScore: number;
  failureRate: number;
}

export interface UserFeedbackResponse {
  userSatisfaction: number;
  averageRating: number;
}

export interface AiCostResponse {
  totalCost: number;
  costByAgent: Array<{
    agentName: string;
    cost: number;
    tokensInput: number;
    tokensOutput: number;
  }>;
}

export interface TenantUsageResponse {
  costByTenant: Array<{
    tenantId: string;
    cost: number;
    tokensInput: number;
    tokensOutput: number;
  }>;
}

export interface LanguagesResponse {
  languages: Array<{
    language: string;
    label: string;
    count: number;
  }>;
  total: number;
}

export interface LanguageTimelineResponse {
  series: Array<{
    language: string;
    label: string;
    points: Array<{
      date: string;
      count: number;
    }>;
  }>;
}

export const analyticsApiService = {
  getAgentQuality() {
    return apiRequest<AgentQualityResponse>("/analytics/agent-quality");
  },

  getUserFeedback() {
    return apiRequest<UserFeedbackResponse>("/analytics/user-feedback");
  },

  getAiCost() {
    return apiRequest<AiCostResponse>("/analytics/ai-cost");
  },

  getTenantUsage() {
    return apiRequest<TenantUsageResponse>("/analytics/tenant-usage");
  },

  getLanguages() {
    return apiRequest<LanguagesResponse>("/analytics/languages");
  },

  getLanguageTimeline() {
    return apiRequest<LanguageTimelineResponse>(
      "/analytics/languages/timeline",
    );
  },
};
