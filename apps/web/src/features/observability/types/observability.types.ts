export interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
  version: string;
  database: string;
}

export interface ObservabilityLinks {
  apiHealth: string;
  apiMetrics: string;
  prometheus: string;
  grafana: string;
}
