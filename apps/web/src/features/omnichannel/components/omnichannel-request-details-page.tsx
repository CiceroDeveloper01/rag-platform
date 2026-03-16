"use client";

import Link from "next/link";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { PageHeader } from "@/src/components/ui/page-header";
import { StatusPill } from "@/src/components/ui/status-pill";
import { useOmnichannelRequestDetails } from "../hooks/use-omnichannel-request-details";
import { RequestDetailsPanel } from "./request-details-panel";

export function OmnichannelRequestDetailsPage({
  requestId,
}: {
  requestId: number;
}) {
  const { data, error, isLoading, isRefreshing, refetch } =
    useOmnichannelRequestDetails(requestId, { refreshIntervalMs: 15_000 });

  return (
    <div className="space-y-8">

      <PageHeader
        eyebrow="Omnichannel / Request details"
        title={`Diagnostico da request #${requestId}`}
        description="Inspecione payload da mensagem, metadados, status da execucao, uso do RAG e a timeline operacional."
        actions={
          <div className="flex flex-wrap items-center gap-3">

            <StatusPill tone={isRefreshing ? "warning" : "success"}>
                            {isRefreshing ? "Refreshing" : "Live 15s"}

            </StatusPill>

            <Link
              href="/dashboard/omnichannel/requests"
              className="inline-flex h-11 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
                            Voltar
            </Link>

            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex h-11 items-center justify-center rounded-[16px] bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
            >
                            Atualizar
            </button>

          </div>
        }
      />

      {isLoading ? (
        <LoadingPanel
          title="Carregando detalhe da request"
          description="Consultando mensagem, execucao associada e timeline operacional."
        />
      ) : error || !data ? (
        <ErrorState
          description={
            error ?? "Nao foi possivel carregar o detalhe da request."
          }
        />
      ) : (
        <RequestDetailsPanel details={data} />
      )}

    </div>
  );
}
