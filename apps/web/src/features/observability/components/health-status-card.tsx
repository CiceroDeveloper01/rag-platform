import { StatusCard } from "@/src/components/ui/status-card";
import type { HealthResponse } from "../types/observability.types";

export function HealthStatusCard({
  health,
  error,
}: {
  health: HealthResponse | null;
  error: string | null;
}) {
  return (
    <StatusCard
      title="API Health"
      value={health?.status ?? (error ? "error" : "pending")}
      tone={health?.status === "ok" ? "success" : error ? "error" : "warning"}
      description={
        health
          ? `Banco: ${health.database}. Versao: ${health.version}. Uptime: ${health.uptime.toFixed(1)}s.`
          : (error ?? "Verificacao do endpoint /health do backend.")
      }
    />
  );
}
