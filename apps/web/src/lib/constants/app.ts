const DEFAULT_API_BASE_URL = "http://localhost:3001";
const DEFAULT_PROMETHEUS_URL = "http://localhost:9090";
const DEFAULT_GRAFANA_URL = "http://localhost:3002";

export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  prometheusUrl:
    process.env.NEXT_PUBLIC_PROMETHEUS_URL ?? DEFAULT_PROMETHEUS_URL,
  grafanaUrl: process.env.NEXT_PUBLIC_GRAFANA_URL ?? DEFAULT_GRAFANA_URL,
  appEnvironment: process.env.NEXT_PUBLIC_APP_ENV ?? "local",
  chatStreamingEnabled: process.env.NEXT_PUBLIC_CHAT_STREAMING !== "false",
};

export const appLinks = {
  apiHealth: `${env.apiBaseUrl.replace(/\/$/, "")}/health`,
  apiMetrics: `${env.apiBaseUrl.replace(/\/$/, "")}/metrics`,
  prometheus: env.prometheusUrl,
  grafana: env.grafanaUrl,
};
