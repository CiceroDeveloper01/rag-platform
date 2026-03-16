"use client";

import { useState } from "react";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import { formatDate } from "@rag-platform/utils";
import type { Connector } from "@/src/types/omnichannel";

export function ConnectorStatusList({
  connectors,
  isLoading,
  error,
  onToggleConnector,
}: {
  connectors: Connector[];
  isLoading: boolean;
  error: string | null;
  onToggleConnector: (connector: Connector) => Promise<void>;
}) {
  const [pendingId, setPendingId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <LoadingPanel
        title="Carregando conectores"
        description="Buscando status operacional e disponibilidade dos conectores omnichannel."
      />
    );
  }

  if (error) {
    return <ErrorState description={error} />;
  }

  return (
    <SectionCard className="space-y-5">

      <div>

        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Connectors
        </div>

        <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                    Status dos conectores omnichannel
        </h2>

      </div>

      <div className="grid gap-4">

        {connectors.map((connector) => (
          <div
            key={connector.id}
            className="grid gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-5 lg:grid-cols-[1.2fr_0.9fr_0.9fr_auto]"
          >

            <div>

              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                {connector.channel}

              </div>

              <div className="mt-2 text-lg font-semibold text-slate-950">
                                {connector.name}

              </div>

              <div className="mt-2 text-sm text-slate-500">
                                Ultimo health check:
                {formatDate(connector.lastHealthCheckAt, {
                  locale: "pt-BR",
                  fallback: "Nunca verificado",
                })}

              </div>

            </div>

            <div className="space-y-2">

              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                Availability
              </div>

              <StatusPill tone={connector.isEnabled ? "success" : "warning"}>
                                {connector.isEnabled ? "Enabled" : "Disabled"}

              </StatusPill>

            </div>

            <div className="space-y-2">

              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                                Health
              </div>

              <StatusPill
                tone={
                  connector.healthStatus === "HEALTHY"
                    ? "success"
                    : connector.healthStatus === "DOWN"
                      ? "error"
                      : "warning"
                }
              >
                                {connector.healthStatus}

              </StatusPill>

            </div>

            <div className="flex items-center justify-start lg:justify-end">

              <button
                type="button"
                aria-label={`${connector.isEnabled ? "Desabilitar" : "Habilitar"} ${connector.name}`}
                onClick={async () => {
                  setPendingId(connector.id);
                  try {
                    await onToggleConnector(connector);
                  } finally {
                    setPendingId(null);
                  }
                }}
                disabled={pendingId === connector.id}
                className="inline-flex h-11 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {pendingId === connector.id
                  ? "Atualizando..."
                  : connector.isEnabled
                    ? "Disable"
                    : "Enable"}

              </button>

            </div>

          </div>
        ))}

      </div>

    </SectionCard>
  );
}
