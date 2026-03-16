import { Injectable } from "@nestjs/common";

export interface TenantConfig {
  tenantId: string;
  agentsEnabled: string[];
  knowledgeBase: string;
  promptConfiguration: Record<string, string>;
  rateLimits: {
    requestsPerMinute: number;
  };
}

@Injectable()
export class TenantConfigLoader {
  private readonly tenantConfigs = new Map<string, TenantConfig>([
    [
      "default-tenant",
      {
        tenantId: "default-tenant",
        agentsEnabled: [
          "document-agent",
          "conversation-agent",
          "handoff-agent",
        ],
        knowledgeBase: "default-rag",
        promptConfiguration: {
          tone: "helpful",
          answerStyle: "concise",
        },
        rateLimits: {
          requestsPerMinute: 60,
        },
      },
    ],
  ]);

  load(tenantId: string): TenantConfig {
    return (
      this.tenantConfigs.get(tenantId) ?? {
        ...this.tenantConfigs.get("default-tenant")!,
        tenantId,
      }
    );
  }
}
