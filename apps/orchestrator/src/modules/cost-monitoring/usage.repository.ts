import { Injectable } from "@nestjs/common";

export interface AiUsageMetricRecord {
  tenantId: string;
  agentName: string;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  model: string;
  timestamp: string;
}

@Injectable()
export class UsageRepository {
  private readonly records: AiUsageMetricRecord[] = [];

  save(record: AiUsageMetricRecord): AiUsageMetricRecord {
    this.records.unshift(record);
    this.records.splice(500);
    return record;
  }

  summarizeByAgent() {
    const totals = new Map<
      string,
      {
        agentName: string;
        cost: number;
        tokensInput: number;
        tokensOutput: number;
      }
    >();

    for (const record of this.records) {
      const current = totals.get(record.agentName) ?? {
        agentName: record.agentName,
        cost: 0,
        tokensInput: 0,
        tokensOutput: 0,
      };

      current.cost += record.cost;
      current.tokensInput += record.tokensInput;
      current.tokensOutput += record.tokensOutput;
      totals.set(record.agentName, current);
    }

    return Array.from(totals.values()).map((item) => ({
      ...item,
      cost: round(item.cost),
    }));
  }

  summarizeByTenant() {
    const totals = new Map<
      string,
      {
        tenantId: string;
        cost: number;
        tokensInput: number;
        tokensOutput: number;
      }
    >();

    for (const record of this.records) {
      const current = totals.get(record.tenantId) ?? {
        tenantId: record.tenantId,
        cost: 0,
        tokensInput: 0,
        tokensOutput: 0,
      };

      current.cost += record.cost;
      current.tokensInput += record.tokensInput;
      current.tokensOutput += record.tokensOutput;
      totals.set(record.tenantId, current);
    }

    return Array.from(totals.values()).map((item) => ({
      ...item,
      cost: round(item.cost),
    }));
  }
}

function round(value: number): number {
  return Number(value.toFixed(6));
}
