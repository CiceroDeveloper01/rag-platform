import type { Channel } from '@rag-platform/contracts';

export interface AnalyticsCostBreakdownEntry {
  agentName: string;
  cost: number;
  tokensInput: number;
  tokensOutput: number;
}

export interface TenantUsageEntry {
  tenantId: string;
  cost: number;
  tokensInput: number;
  tokensOutput: number;
}

export interface AnalyticsPublishPayload {
  eventType:
    | 'analytics.message.received'
    | 'analytics.agent.selected'
    | 'analytics.flow.executed'
    | 'analytics.agent.quality'
    | 'analytics.user.feedback'
    | 'analytics.ai.cost'
    | 'analytics.tenant.usage';
  timestamp: string;
  channel?: Channel;
  language?: 'pt' | 'en' | 'es';
  agent?: string;
  flow?: string;
  tenantId?: string;
  model?: string;
  keywords?: string[];
  averageQualityScore?: number;
  failureRate?: number;
  userSatisfaction?: number;
  averageRating?: number;
  totalCost?: number;
  tokensInput?: number;
  tokensOutput?: number;
  costByAgent?: AnalyticsCostBreakdownEntry[];
  costByTenant?: TenantUsageEntry[];
}
