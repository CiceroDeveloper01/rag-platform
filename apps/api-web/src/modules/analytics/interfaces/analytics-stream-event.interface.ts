import type {
  AnalyticsCostBreakdownEntry,
} from './analytics-cost-snapshot.interface';
import type {
  TenantUsageEntry,
} from './tenant-usage-snapshot.interface';

export interface AnalyticsStreamEvent {
  eventType:
    | 'message_received'
    | 'agent_selected'
    | 'flow_executed'
    | 'agent_quality'
    | 'user_feedback'
    | 'ai_cost'
    | 'tenant_usage';
  timestamp: string;
  channel?: string;
  language?: string;
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

export interface IncomingAnalyticsEvent {
  eventType: string;
  timestamp: string;
  channel?: string;
  language?: string;
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
