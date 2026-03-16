"use client";

import { useState } from "react";
import { PageHeader } from "@/src/components/ui/page-header";
import { StatusPill } from "@/src/components/ui/status-pill";
import type { OmnichannelRequestFilters } from "@/src/types/omnichannel";
import { useOmnichannelRequests } from "../hooks/use-omnichannel-requests";
import { RequestsTable } from "./requests-table";

export function OmnichannelRequestsPage() {
  const [filters, setFilters] = useState<OmnichannelRequestFilters>({
    limit: 20,
    offset: 0,
    sortOrder: "desc",
  });
  const { data, error, isLoading, isRefreshing, refetch } =
    useOmnichannelRequests(filters, {
      refreshIntervalMs: 15_000,
    });

  return (
    <div className="space-y-8">

      <PageHeader
        eyebrow="Omnichannel / Requests"
        title="Fila operacional de requests"
        description="Navegue pelas mensagens processadas, filtre por canal e status, e entre no detalhe de cada execucao."
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

      <RequestsTable
        requests={data?.items ?? []}
        pagination={
          data?.pagination ?? {
            total: 0,
            limit: filters.limit ?? 20,
            offset: filters.offset ?? 0,
          }
        }
        filters={filters}
        isLoading={isLoading}
        error={error}
        onChangeFilters={(next) =>
          setFilters((current) => ({ ...current, ...next }))
        }
      />

    </div>
  );
}
