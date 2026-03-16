"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AgentQualityChart } from "@/src/components/AgentQualityChart";
import { AgentUsageChart } from "@/src/components/AgentUsageChart";
import { ChannelTrafficChart } from "@/src/components/ChannelTrafficChart";
import { FlowExecutionChart } from "@/src/components/FlowExecutionChart";
import { KeywordCloud } from "@/src/components/KeywordCloud";
import { LanguageDistributionPanel } from "@/src/components/LanguageDistributionPanel";
import { LanguageTimelineChart } from "@/src/components/LanguageTimelineChart";
import { LanguageUsageChart } from "@/src/components/LanguageUsageChart";
import { UserFeedbackChart } from "@/src/components/UserFeedbackChart";
import { navigationItems } from "@/src/components/layout/navigation";
import { DashboardOverview } from "@/src/features/dashboard/components/dashboard-overview";
import { analyticsApiService } from "@/src/services/analytics-api.service";
import {
  type AnalyticsSocketEvent,
  connectAnalyticsSocket,
} from "@/src/services/analytics.socket";

type ConnectionState = "connecting" | "live" | "disconnected";

export function DashboardPage() {
  const [events, setEvents] = useState<AnalyticsSocketEvent[]>([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [agentQuality, setAgentQuality] = useState({
    averageQualityScore: 0,
    failureRate: 0,
  });
  const [userFeedback, setUserFeedback] = useState({
    userSatisfaction: 0,
    averageRating: 0,
  });
  const [aiCost, setAiCost] = useState({
    totalCost: 0,
  });
  const [languageUsage, setLanguageUsage] = useState<
    Array<{ language: string; label: string; count: number }>
  >([]);
  const [languageTimeline, setLanguageTimeline] = useState<
    Array<{
      language: string;
      label: string;
      points: Array<{ date: string; count: number }>;
    }>
  >([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      try {
        const [quality, feedback, cost, languages, timeline] =
          await Promise.all([
            analyticsApiService.getAgentQuality(),
            analyticsApiService.getUserFeedback(),
            analyticsApiService.getAiCost(),
            analyticsApiService.getLanguages(),
            analyticsApiService.getLanguageTimeline(),
          ]);

        if (isMounted) {
          setAgentQuality(quality);
          setUserFeedback(feedback);
          setAiCost(cost);
          setLanguageUsage(languages.languages);
          setLanguageTimeline(timeline.series);
        }
      } catch {
        // Keep the live dashboard resilient when analytics endpoints are still warming up.
      }
    }

    void loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let socket: WebSocket | undefined;
    let isCancelled = false;

    const connect = () => {
      if (isCancelled) {
        return;
      }

      setConnectionState("connecting");

      socket = connectAnalyticsSocket({
        onOpen: () => setConnectionState("live"),
        onClose: () => {
          setConnectionState("disconnected");
          reconnectTimer = setTimeout(connect, 2000);
        },
        onError: () => {
          setConnectionState("disconnected");
        },
        onEvent: (event) => {
          setEvents((current) => [event, ...current].slice(0, 100));

          if (event.eventType === "message_received" && event.language) {
            const language = event.language;
            const label = languageLabel(language);
            const date = event.timestamp.slice(0, 10);

            setLanguageUsage((current) => {
              const counts = new Map(
                current.map((entry) => [
                  entry.language,
                  { label: entry.label, count: entry.count },
                ]),
              );

              const currentEntry = counts.get(language);
              counts.set(language, {
                label: currentEntry?.label ?? label,
                count: (currentEntry?.count ?? 0) + 1,
              });

              return Array.from(counts.entries())
                .map(([languageKey, entry]) => ({
                  language: languageKey,
                  label: entry.label,
                  count: entry.count,
                }))
                .sort((left, right) => right.count - left.count);
            });

            setLanguageTimeline((current) => {
              const byLanguage = new Map(
                current.map((entry) => [entry.language, entry]),
              );
              const currentSeries = byLanguage.get(language) ?? {
                language,
                label,
                points: [],
              };
              const pointMap = new Map(
                currentSeries.points.map((point) => [point.date, point.count]),
              );

              pointMap.set(date, (pointMap.get(date) ?? 0) + 1);
              byLanguage.set(language, {
                language,
                label: currentSeries.label,
                points: Array.from(pointMap.entries())
                  .map(([pointDate, count]) => ({ date: pointDate, count }))
                  .sort((left, right) => left.date.localeCompare(right.date)),
              });

              return Array.from(byLanguage.values()).sort(
                (left, right) =>
                  right.points.reduce((sum, point) => sum + point.count, 0) -
                  left.points.reduce((sum, point) => sum + point.count, 0),
              );
            });
          }

          if (event.eventType === "agent_quality") {
            setAgentQuality({
              averageQualityScore: event.averageQualityScore ?? 0,
              failureRate: event.failureRate ?? 0,
            });
          }

          if (event.eventType === "user_feedback") {
            setUserFeedback({
              userSatisfaction: event.userSatisfaction ?? 0,
              averageRating: event.averageRating ?? 0,
            });
          }
        },
      });
    };

    connect();

    return () => {
      isCancelled = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      socket?.close();
    };
  }, []);

  const filteredEvents = useMemo(() => {
    if (selectedLanguage === "all") {
      return events;
    }

    return events.filter((event) => event.language === selectedLanguage);
  }, [events, selectedLanguage]);

  const filteredLanguageUsage = useMemo(() => {
    if (selectedLanguage === "all") {
      return languageUsage;
    }

    return languageUsage.filter((entry) => entry.language === selectedLanguage);
  }, [languageUsage, selectedLanguage]);

  const filteredLanguageTimeline = useMemo(() => {
    if (selectedLanguage === "all") {
      return languageTimeline;
    }

    return languageTimeline.filter(
      (entry) => entry.language === selectedLanguage,
    );
  }, [languageTimeline, selectedLanguage]);

  const totalLanguageEvents = useMemo(
    () => filteredLanguageUsage.reduce((sum, entry) => sum + entry.count, 0),
    [filteredLanguageUsage],
  );

  const totalMessages = filteredEvents.filter(
    (event) => event.eventType === "message_received",
  ).length;
  const totalAgentSelections = filteredEvents.filter(
    (event) => event.eventType === "agent_selected",
  ).length;
  const totalFlowExecutions = filteredEvents.filter(
    (event) => event.eventType === "flow_executed",
  ).length;

  const channelTraffic = useMemo(() => {
    const counts = new Map<string, number>();

    for (const event of filteredEvents) {
      if (!event.channel) continue;
      counts.set(event.channel, (counts.get(event.channel) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([channel, total]) => ({
      channel,
      total,
    }));
  }, [filteredEvents]);

  const agentUsage = useMemo(() => {
    const counts = new Map<string, number>();

    for (const event of filteredEvents) {
      if (!event.agent) continue;
      counts.set(event.agent, (counts.get(event.agent) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([agent, total]) => ({
      agent,
      total,
    }));
  }, [filteredEvents]);

  const flowUsage = useMemo(() => {
    const counts = new Map<string, number>();

    for (const event of filteredEvents) {
      if (!event.flow) continue;
      counts.set(event.flow, (counts.get(event.flow) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([flow, total]) => ({
      flow,
      total,
    }));
  }, [filteredEvents]);

  const keywords = useMemo(() => {
    const counts = new Map<string, number>();

    for (const event of filteredEvents) {
      for (const keyword of event.keywords ?? []) {
        counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([keyword, total]) => ({ keyword, total }))
      .sort((left, right) => right.total - left.total)
      .slice(0, 24);
  }, [filteredEvents]);

  const qualityChartData = useMemo(
    () => [
      {
        metric: "Quality",
        score: agentQuality.averageQualityScore,
      },
      {
        metric: "Failure",
        score: agentQuality.failureRate,
      },
    ],
    [agentQuality],
  );

  const feedbackChartData = useMemo(
    () => [
      {
        name: "Satisfaction",
        value: userFeedback.userSatisfaction,
      },
      {
        name: "Rating",
        value: Math.min(userFeedback.averageRating / 5, 1),
      },
    ],
    [userFeedback],
  );

  const dominantLanguage = filteredLanguageUsage[0];
  const dominantAgent = agentUsage[0];
  const quickLinks = navigationItems.filter((item) =>
    [
      "/dashboard/omnichannel",
      "/command-center",
      "/dashboard/cost-monitor",
      "/simulation-lab",
    ].includes(item.href),
  );

  const executiveKpis = [
    {
      label: "Tracked messages",
      value: String(totalMessages),
      tone: "sky",
      hint:
        selectedLanguage === "all"
          ? "Live stream analytics"
          : "Filtered by language",
    },
    {
      label: "Active agents",
      value: String(agentUsage.length),
      tone: "amber",
      hint: dominantAgent
        ? `${dominantAgent.agent} lidera o uso`
        : "Aguardando atividade",
    },
    {
      label: "Dominant language",
      value: dominantLanguage?.label ?? "No data",
      tone: "indigo",
      hint: dominantLanguage
        ? `${formatShare(dominantLanguage.count, totalLanguageEvents)} do volume`
        : "Nenhum idioma detectado",
    },
    {
      label: "AI quality score",
      value: formatRatio(agentQuality.averageQualityScore),
      tone: "emerald",
      hint: `Failure ${formatRatio(agentQuality.failureRate)}`,
    },
    {
      label: "Estimated AI cost",
      value: formatCurrency(aiCost.totalCost),
      tone: "rose",
      hint: "Acumulado do analytics atual",
    },
  ] as const;

  return (
    <div className="space-y-8">

      <section className="overflow-hidden rounded-[36px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_28%),linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] p-6 shadow-[0_36px_120px_-72px_rgba(15,23,42,0.45)] backdrop-blur">

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">

          <div className="rounded-[30px] border border-slate-200/80 bg-white/70 p-6 shadow-[0_18px_60px_-50px_rgba(15,23,42,0.45)]">

            <div className="flex flex-wrap items-center justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-700">
                                    AI Operations Command
                </p>

                <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                                    Centro executivo de monitoramento dos agentes

                </h2>

                <p className="mt-2 max-w-3xl text-sm text-slate-600">
                                    Leitura executiva e técnica do sistema com sinais de uso,
                                    idiomas, qualidade, fluxos e inteligência operacional em tempo
                                    real.
                </p>

              </div>

              <span
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] ${
                  connectionState === "live"
                    ? "bg-emerald-100 text-emerald-700"
                    : connectionState === "connecting"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                }`}
              >

                {connectionState === "live"
                  ? "Live"
                  : connectionState === "connecting"
                    ? "Connecting"
                    : "Disconnected"}

              </span>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <HeroSignalCard
                label="Dominant language"
                value={dominantLanguage?.label ?? "No data"}
                hint={
                  dominantLanguage
                    ? `${formatShare(dominantLanguage.count, totalLanguageEvents)} of current volume`
                    : "Waiting for language analytics"
                }
              />

              <HeroSignalCard
                label="Top agent"
                value={dominantAgent?.agent ?? "No data"}
                hint={
                  dominantAgent
                    ? `${dominantAgent.total} routed executions`
                    : "Waiting for routing events"
                }
              />

            </div>

          </div>

          <OperationalSignalsPanel
            connectionState={connectionState}
            dominantLanguage={dominantLanguage?.label ?? "No data"}
            topAgent={dominantAgent?.agent ?? "No data"}
            flowExecutions={totalFlowExecutions}
            agentSelections={totalAgentSelections}
            satisfaction={userFeedback.userSatisfaction}
            selectedLanguage={
              selectedLanguage === "all"
                ? "All languages"
                : languageLabel(selectedLanguage)
            }
          />

        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-5">

          {executiveKpis.map((item) => (
            <ExecutiveKpiCard
              key={item.label}
              label={item.label}
              value={item.value}
              hint={item.hint}
              tone={item.tone}
            />
          ))}

        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">

          <div className="rounded-[28px] border border-slate-200/80 bg-white/80 p-5 shadow-[0_18px_60px_-50px_rgba(15,23,42,0.45)]">

            <div className="flex flex-wrap items-center justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                                    Navigation
                </p>

                <p className="mt-1 text-sm text-slate-600">
                                    Acesso rapido aos paineis taticos e tecnicos do workspace.

                </p>

              </div>

              <div className="flex flex-wrap gap-3">

                {quickLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                                        {item.label}

                  </Link>
                ))}

              </div>

            </div>

          </div>

          <div className="rounded-[28px] border border-slate-200/80 bg-white/85 p-5 shadow-[0_18px_60px_-50px_rgba(15,23,42,0.45)]">

            <div className="flex flex-wrap items-center justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                                    Operational filter
                </p>

                <p className="mt-1 text-sm text-slate-600">

                  {selectedLanguage === "all"
                    ? "Mostrando todos os idiomas monitorados."
                    : `Mostrando somente ${languageLabel(selectedLanguage)}.`}

                </p>

              </div>

              <select
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-indigo-300"
              >
                                <option value="all">All languages</option>

                {languageUsage.map((entry) => (
                  <option key={entry.language} value={entry.language}>
                                        {entry.label}

                  </option>
                ))}

              </select>

            </div>

          </div>

        </div>

        <SectionHeader
          className="mt-10"
          eyebrow="Languages"
          title="Global language presence"
          description="Bloco executivo para distribuicao, ranking e tendencia dos idiomas detectados."
        />

        <div className="mt-6 grid gap-6">

          <LanguageDistributionPanel
            data={filteredLanguageUsage}
            total={totalLanguageEvents}
          />

        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.72fr]">

          <LanguageUsageChart data={filteredLanguageUsage} />

          <LanguageTimelineChart series={filteredLanguageTimeline} />

        </div>

        <SectionHeader
          className="mt-10"
          eyebrow="Monitoring"
          title="Realtime monitoring"
          description="Volume por canal, uso dos agentes e fluxos disparados pelo orchestrator."
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-3">

          <ChannelTrafficChart data={channelTraffic} />

          <AgentUsageChart data={agentUsage} />

          <FlowExecutionChart data={flowUsage} />

        </div>

        <SectionHeader
          className="mt-10"
          eyebrow="Intelligence"
          title="Operational intelligence"
          description="Leitura de tendencias, clusters de pergunta e sinais de aprendizado mais relevantes."
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

          <KeywordCloud data={keywords} />

          <InsightsNarrativePanel
            dominantLanguage={dominantLanguage?.label ?? "No data"}
            topAgent={dominantAgent?.agent ?? "No data"}
            topKeyword={keywords[0]?.keyword ?? "No signals yet"}
            topChannel={channelTraffic[0]?.channel ?? "No signals yet"}
            selectedLanguage={
              selectedLanguage === "all"
                ? "All languages"
                : languageLabel(selectedLanguage)
            }
          />

        </div>

        <SectionHeader
          className="mt-10"
          eyebrow="Quality"
          title="Quality and feedback"
          description="Resumo da qualidade percebida, falha operacional e satisfacao do usuario."
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-2">

          <AgentQualityChart data={qualityChartData} />

          <UserFeedbackChart data={feedbackChartData} />

        </div>

      </section>

      <section className="space-y-6">

        <SectionHeader
          eyebrow="Platform overview"
          title="Workspace context"
          description="Camada complementar com saude do ambiente, documentos, conversas e atalhos operacionais da plataforma."
        />

        <DashboardOverview />

      </section>

    </div>
  );
}

function languageLabel(language: string) {
  switch (language) {
    case "en":
      return "English";
    case "pt":
      return "Português";
    case "es":
      return "Español";
    default:
      return language.toUpperCase();
  }
}

function SectionHeader({
  eyebrow,
  title,
  description,
  className = "",
}: {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={className}>

      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                {eyebrow}

      </p>

      <h3 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h3>

      <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p>

    </div>
  );
}

function ExecutiveKpiCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "sky" | "amber" | "indigo" | "emerald" | "rose";
}) {
  const toneClasses = {
    sky: "border-sky-200 bg-sky-50/80 text-sky-700",
    amber: "border-amber-200 bg-amber-50/80 text-amber-700",
    indigo: "border-indigo-200 bg-indigo-50/80 text-indigo-700",
    emerald: "border-emerald-200 bg-emerald-50/80 text-emerald-700",
    rose: "border-rose-200 bg-rose-50/80 text-rose-700",
  }[tone];

  return (
    <article className="rounded-[26px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)]">

      <div className="flex items-center justify-between gap-3">

        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    {label}

        </p>

        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${toneClasses}`}
        >
                    Live
        </span>

      </div>

      <p className="mt-5 text-3xl font-semibold text-slate-950">{value}</p>
            <p className="mt-2 text-sm text-slate-600">{hint}</p>

    </article>
  );
}

function HeroSignalCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="rounded-[22px] border border-slate-200/80 bg-slate-50/90 p-4">

      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                {label}

      </p>

      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
            <p className="mt-2 text-sm text-slate-600">{hint}</p>

    </article>
  );
}

function OperationalSignalsPanel({
  connectionState,
  dominantLanguage,
  topAgent,
  flowExecutions,
  agentSelections,
  satisfaction,
  selectedLanguage,
}: {
  connectionState: ConnectionState;
  dominantLanguage: string;
  topAgent: string;
  flowExecutions: number;
  agentSelections: number;
  satisfaction: number;
  selectedLanguage: string;
}) {
  const signals = [
    {
      label: "Stream status",
      value:
        connectionState === "live"
          ? "Healthy"
          : connectionState === "connecting"
            ? "Warming up"
            : "Attention needed",
    },
    { label: "Dominant language", value: dominantLanguage },
    { label: "Top agent", value: topAgent },
    { label: "Language filter", value: selectedLanguage },
    { label: "Flow executions", value: String(flowExecutions) },
    { label: "Agent selections", value: String(agentSelections) },
    { label: "User satisfaction", value: formatRatio(satisfaction) },
  ];

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(155deg,rgba(15,23,42,0.97),rgba(30,41,59,0.92))] p-6 text-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.65)]">

      <div className="mb-5">

        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
                    Operational Signals
        </p>

        <h3 className="mt-2 text-xl font-semibold text-white">
                    Centro tecnico de leitura rapida
        </h3>

        <p className="mt-2 text-sm text-slate-300">
                    Sinais consolidados para demos executivas e acompanhamento tecnico do
                    runtime.
        </p>

      </div>

      <div className="grid gap-3 sm:grid-cols-2">

        {signals.map((signal) => (
          <article
            key={signal.label}
            className="rounded-[20px] border border-white/10 bg-white/5 p-4"
          >

            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                            {signal.label}

            </p>

            <p className="mt-3 text-lg font-semibold text-white">
                            {signal.value}

            </p>

          </article>
        ))}

      </div>

    </section>
  );
}

function InsightsNarrativePanel({
  dominantLanguage,
  topAgent,
  topKeyword,
  topChannel,
  selectedLanguage,
}: {
  dominantLanguage: string;
  topAgent: string;
  topKeyword: string;
  topChannel: string;
  selectedLanguage: string;
}) {
  const items = [
    {
      title: "Dominant language",
      description: `${dominantLanguage} leads the current interaction mix.`,
    },
    {
      title: "Top agent",
      description: `${topAgent} is receiving the highest routing pressure.`,
    },
    {
      title: "Top question signal",
      description: `Keyword focus is currently centered on "${topKeyword}".`,
    },
    {
      title: "Primary channel",
      description: `${topChannel} is driving the largest share of observable traffic.`,
    },
    {
      title: "Active filter",
      description: `The dashboard is reading analytics under ${selectedLanguage}.`,
    },
  ];

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">

      <div className="mb-4">

        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-600">
                    Learning insights
        </p>

        <h3 className="text-xl font-semibold text-slate-950">
                    Executive narrative
        </h3>

      </div>

      <div className="space-y-3">

        {items.map((item) => (
          <article
            key={item.title}
            className="rounded-[20px] border border-slate-200/80 bg-slate-50/80 p-4"
          >

            <p className="text-sm font-semibold text-slate-950">{item.title}</p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
                            {item.description}

            </p>

          </article>
        ))}

      </div>

    </section>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRatio(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatShare(value: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}
