export interface TenantUsageEntry {
  tenantId: string;
  cost: number;
  tokensInput: number;
  tokensOutput: number;
}

export interface TenantUsageSnapshot {
  costByTenant: TenantUsageEntry[];
}
