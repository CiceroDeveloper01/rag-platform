"use client";

import { useState } from "react";
import { PageHeader } from "@/src/components/ui/page-header";
import { StatusPill } from "@/src/components/ui/status-pill";
import type {
  Connector,
  OmnichannelConnectorFilters,
} from "@/src/types/omnichannel";
import { useOmnichannelConnectors } from "../hooks/use-omnichannel-connectors";
import { ConnectorStatusList } from "./connector-status-list";

export function OmnichannelConnectorsPage() {
  const [filters, setFilters] = useState<OmnichannelConnectorFilters>({});
  const { data, error, isLoading, isRefreshing, refetch, toggleConnector } =
    useOmnichannelConnectors(filters, {
      refreshIntervalMs: 15_000,
    });

  return (
    <div className="space-y-8">

      <PageHeader
        eyebrow="Omnichannel / Connectors"
        title="Operacao e disponibilidade dos conectores"
        description="Acompanhe health, disponibilidade e habilite ou desabilite conectores do gateway omnichannel."
        actions={
          <div className="flex flex-wrap items-center gap-3">

            <StatusPill tone={isRefreshing ? "warning" : "success"}>
                            {isRefreshing ? "Refreshing" : "Live 15s"}

            </StatusPill>

            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex h-11 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
                            Atualizar
            </button>

          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">

        <select
          aria-label="Filtrar conectores por canal"
          value={filters.channel ?? ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              channel: event.target
                .value as OmnichannelConnectorFilters["channel"],
            }))
          }
          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        >
                    <option value="">Todos os canais</option>
                    <option value="TELEGRAM">TELEGRAM</option>
                    <option value="EMAIL">EMAIL</option>
                    <option value="TEAMS">TEAMS</option>
                    <option value="WHATSAPP">WHATSAPP</option>
                    <option value="SLACK">SLACK</option>
                    <option value="SMS">SMS</option>
                    <option value="VOICE">VOICE</option>
                    <option value="ROAM">ROAM</option>

        </select>

        <select
          aria-label="Filtrar conectores por health"
          value={filters.healthStatus ?? ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              healthStatus: event.target
                .value as OmnichannelConnectorFilters["healthStatus"],
            }))
          }
          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        >
                    <option value="">Todos os health states</option>
                    <option value="HEALTHY">HEALTHY</option>
                    <option value="DEGRADED">DEGRADED</option>
                    <option value="DOWN">DOWN</option>
                    <option value="UNKNOWN">UNKNOWN</option>

        </select>

        <select
          aria-label="Filtrar conectores por disponibilidade"
          value={filters.isEnabled ?? ""}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              isEnabled: event.target
                .value as OmnichannelConnectorFilters["isEnabled"],
            }))
          }
          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        >
                    <option value="">Todos</option>
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>

        </select>

      </div>

      <ConnectorStatusList
        connectors={data ?? []}
        isLoading={isLoading}
        error={error}
        onToggleConnector={(connector: Connector) =>
          toggleConnector(connector.id, !connector.isEnabled)
        }
      />

    </div>
  );
}
