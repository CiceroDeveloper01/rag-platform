export interface AnalyticsCostBreakdownEntry {
  agentName: string;
  cost: number;
  tokensInput: number;
  tokensOutput: number;
}

export interface AnalyticsCostSnapshot {
  totalCost: number;
  costByAgent: AnalyticsCostBreakdownEntry[];
}
