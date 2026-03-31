"use client";

import Link from "next/link";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import { formatDate, truncateText } from "@rag-platform/utils";
import type {
  OmnichannelPagination,
  OmnichannelRequest,
  OmnichannelRequestFilters,
} from "@/src/types/omnichannel";

const CHANNEL_OPTIONS = [
  "",
  "TELEGRAM",
  "EMAIL",
  "TEAMS",
  "WHATSAPP",
  "SLACK",
  "SMS",
  "VOICE",
  "ROAM",
];
const STATUS_OPTIONS = [
  "",
  "RECEIVED",
  "NORMALIZED",
  "PROCESSING",
  "PROCESSED",
  "FAILED",
  "DISPATCHED",
];

export function RequestsTable({
  requests,
  pagination,
  filters,
  isLoading,
  error,
  onChangeFilters,
}: {
  requests: OmnichannelRequest[];
  pagination: OmnichannelPagination;
  filters: OmnichannelRequestFilters;
  isLoading: boolean;
  error: string | null;
  onChangeFilters: (next: Partial<OmnichannelRequestFilters>) => void;
}) {
  if (isLoading) {
    return (
      <LoadingPanel
        title="Carregando requests"
        description="Buscando mensagens processadas pelo gateway omnichannel com filtros e paginacao."
      />
    );
  }

  if (error) {
    return <ErrorState description={error} />;
  }

  const currentPage =
    Math.floor((pagination.offset ?? 0) / Math.max(pagination.limit ?? 20, 1)) +
    1;
  const totalPages = Math.max(
    Math.ceil((pagination.total ?? 0) / Math.max(pagination.limit ?? 20, 1)),
    1,
  );

  return (
    <SectionCard className="space-y-5">

      <div className="grid gap-3 lg:grid-cols-5">

        <select
          aria-label="Filtrar por canal"
          value={filters.channel ?? ""}
          onChange={(event) =>
            onChangeFilters({
              channel: event.target
                .value as OmnichannelRequestFilters["channel"],
              offset: 0,
            })
          }
          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        >

          {CHANNEL_OPTIONS.map((option) => (
            <option key={option || "all-channels"} value={option}>
                            {option || "Todos os canais"}

            </option>
          ))}

        </select>

        <select
          aria-label="Filtrar por status"
          value={filters.status ?? ""}
          onChange={(event) =>
            onChangeFilters({
              status: event.target.value as OmnichannelRequestFilters["status"],
              offset: 0,
            })
          }
          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        >

          {STATUS_OPTIONS.map((option) => (
            <option key={option || "all-status"} value={option}>
                            {option || "Todos os status"}

            </option>
          ))}

        </select>

        <input
          aria-label="Filtrar por data inicial"
          type="date"
          value={filters.startDate ?? ""}
          onChange={(event) =>
            onChangeFilters({ startDate: event.target.value, offset: 0 })
          }
          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        />

        <input
          aria-label="Filtrar por data final"
          type="date"
          value={filters.endDate ?? ""}
          onChange={(event) =>
            onChangeFilters({ endDate: event.target.value, offset: 0 })
          }
          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        />

        <select
          aria-label="Ordenar por data"
          value={filters.sortOrder ?? "desc"}
          onChange={(event) =>
            onChangeFilters({
              sortOrder: event.target.value as "asc" | "desc",
              offset: 0,
            })
          }
          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        >
                    <option value="desc">Mais recentes</option>
                    <option value="asc">Mais antigas</option>

        </select>

      </div>

      {requests.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
                    Nenhuma requisicao encontrada para os filtros selecionados.

        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">

          <table className="min-w-full border-collapse">

            <thead className="bg-slate-50/90">

              <tr className="text-left text-xs uppercase tracking-[0.22em] text-slate-500">
                                <th className="px-4 py-4">Request</th>
                                <th className="px-4 py-4">Canal</th>
                                <th className="px-4 py-4">Sender</th>
                                <th className="px-4 py-4">Preview</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4">Knowledge</th>
                                <th className="px-4 py-4">Latencia</th>
                                <th className="px-4 py-4">Recebida</th>

              </tr>

            </thead>

            <tbody>

              {requests.map((request) => (
                <tr
                  key={request.id}
                  className="border-t border-slate-100 text-sm text-slate-700"
                >

                  <td className="px-4 py-4 font-medium text-slate-950">

                    <Link
                      href={`/dashboard/omnichannel/requests/${String(request.id)}`}
                      className="hover:text-sky-700"
                    >
                                            #{request.id}

                    </Link>

                  </td>

                  <td className="px-4 py-4">{request.channel}</td>

                  <td className="px-4 py-4">

                    <div className="font-medium text-slate-900">
                                            {request.senderName ?? "Sem nome"}

                    </div>

                    <div className="text-xs text-slate-500">
                                            {request.senderAddress ?? "N/A"}

                    </div>

                  </td>

                  <td className="px-4 py-4 text-slate-600">

                    {truncateText(request.normalizedTextPreview, 96)}

                  </td>

                  <td className="px-4 py-4">

                    <StatusPill
                      tone={request.status === "FAILED" ? "error" : "info"}
                    >
                                            {request.status}

                    </StatusPill>

                  </td>

                  <td className="px-4 py-4">

                    <StatusPill tone={request.usedRag ? "success" : "neutral"}>

                      {request.usedRag ? "Enabled" : "Direct"}

                    </StatusPill>

                  </td>

                  <td className="px-4 py-4">

                    {request.latencyMs ? `${request.latencyMs} ms` : "n/a"}

                  </td>

                  <td className="px-4 py-4 text-slate-500">

                    {formatDate(request.receivedAt, { locale: "pt-BR" })}

                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div className="text-sm text-slate-500">
                    Pagina {currentPage} de {totalPages} • {pagination.total}
                    itens
        </div>

        <div className="flex gap-2">

          <button
            type="button"
            onClick={() =>
              onChangeFilters({
                offset: Math.max(
                  (pagination.offset ?? 0) - (pagination.limit ?? 20),
                  0,
                ),
              })
            }
            disabled={(pagination.offset ?? 0) === 0}
            className="inline-flex h-10 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
                        Anterior
          </button>

          <button
            type="button"
            onClick={() =>
              onChangeFilters({
                offset: (pagination.offset ?? 0) + (pagination.limit ?? 20),
              })
            }
            disabled={
              (pagination.offset ?? 0) + (pagination.limit ?? 20) >=
              pagination.total
            }
            className="inline-flex h-10 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
                        Proxima
          </button>

        </div>

      </div>

    </SectionCard>
  );
}
