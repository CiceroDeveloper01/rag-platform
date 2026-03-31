"use client";

import Link from "next/link";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { PageHeader } from "@/src/components/ui/page-header";
import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import { useOmnichannelOverview } from "../hooks/use-omnichannel-overview";
import { ChannelDistributionChart } from "./channel-distribution-chart";
import { ErrorRateWidget } from "./error-rate-widget";
import { LatencyChart } from "./latency-chart";
import { LiveActivityFeed } from "./live-activity-feed";
import { RagUsageWidget } from "./rag-usage-widget";
import { SummaryCards } from "./summary-cards";

export function OmnichannelDashboardOverview() {
  const { data, error, isLoading, isRefreshing, refetch } =
    useOmnichannelOverview(undefined, {
      refreshIntervalMs: 15_000,
    });

  return (
    <div className="space-y-8">

      <PageHeader
        eyebrow="Omnichannel"
        title="Command center do gateway omnichannel"
        description="Monitore requests por canal, latencia, uso de conhecimento, taxa de erro e conectores sem sair do dashboard principal."
        actions={
          <div className="flex flex-wrap items-center gap-3">

            <StatusPill tone={isRefreshing ? "warning" : "success"}>
                            {isRefreshing ? "Refreshing" : "Auto refresh 15s"}

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

      {isLoading ? (
        <LoadingPanel
          title="Carregando omnichannel"
          description="Consolidando overview, metricas por canal, latencia, uso de conhecimento e requests recentes."
        />
      ) : error || !data ? (
        <ErrorState
          description={
            error ?? "Nao foi possivel carregar o dashboard omnichannel."
          }
        />
      ) : (
        <>

          <SummaryCards overview={data.overview} />

          <section className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">

            <ChannelDistributionChart data={data.channelMetrics} />

            <LatencyChart data={data.latencyMetrics} />

          </section>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_0.9fr_1.2fr]">

            <RagUsageWidget data={data.ragUsage} />

            <ErrorRateWidget
              successCount={data.overview.successCount}
              errorCount={data.overview.errorCount}
            />

            <SectionCard className="space-y-5">

              <div className="flex flex-wrap items-center justify-between gap-4">

                <div>

                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                        Recent requests
                  </div>

                  <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                                        Ultimas 10 mensagens
                  </h2>

                </div>

                <Link
                  href="/dashboard/omnichannel/requests"
                  className="text-sm font-medium text-sky-700 transition hover:text-sky-800"
                >
                                    Ver listagem completa
                </Link>

              </div>

              <div className="space-y-3">

                {data.recentRequests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/dashboard/omnichannel/requests/${String(request.id)}`}
                    className="block rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-sky-200 hover:bg-sky-50/60"
                  >

                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <div className="font-medium text-slate-950">
                                                #{request.id} •{request.channel}

                      </div>

                      <StatusPill
                        tone={request.usedRag ? "success" : "neutral"}
                      >

                        {request.usedRag ? "Knowledge" : "Direct"}

                      </StatusPill>

                    </div>

                    <p className="mt-2 text-sm leading-7 text-slate-600">
                                            {request.normalizedTextPreview}

                    </p>

                  </Link>
                ))}

              </div>

            </SectionCard>

          </section>

          <section>

            <LiveActivityFeed />

          </section>

        </>
      )}

    </div>
  );
}
