"use client";

import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import { appLinks } from "@/src/lib/constants/app";
import { formatDate } from "@rag-platform/utils";
import { useLiveActivity } from "../hooks/use-live-activity";

const EVENT_STYLES: Record<
  string,
  { dot: string; ring: string; badge: string }
> = {
  green: {
    dot: "bg-emerald-500",
    ring: "ring-emerald-100",
    badge: "bg-emerald-50 text-emerald-700",
  },
  blue: {
    dot: "bg-sky-500",
    ring: "ring-sky-100",
    badge: "bg-sky-50 text-sky-700",
  },
  purple: {
    dot: "bg-violet-500",
    ring: "ring-violet-100",
    badge: "bg-violet-50 text-violet-700",
  },
  yellow: {
    dot: "bg-amber-400",
    ring: "ring-amber-100",
    badge: "bg-amber-50 text-amber-700",
  },
  cyan: {
    dot: "bg-cyan-500",
    ring: "ring-cyan-100",
    badge: "bg-cyan-50 text-cyan-700",
  },
  red: {
    dot: "bg-rose-500",
    ring: "ring-rose-100",
    badge: "bg-rose-50 text-rose-700",
  },
  slate: {
    dot: "bg-slate-400",
    ring: "ring-slate-100",
    badge: "bg-slate-100 text-slate-700",
  },
};

const ICON_LABELS: Record<string, string> = {
  "message-circle": "MSG",
  play: "RUN",
  search: "FIND",
  database: "DB",
  bot: "BOT",
  "check-circle": "OK",
  send: "SEND",
  "alert-circle": "ERR",
  shield: "POL",
  "shield-check": "PASS",
  "shield-alert": "BLOCK",
  "toggle-left": "FLAG",
  "toggle-right": "OFF",
  shuffle: "FALL",
  sparkles: "NORM",
  activity: "ACT",
};

function toLabel(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function LiveActivityFeed() {
  const { events, status } = useLiveActivity({ maxItems: 100 });
  const latestEvent = events[0] ?? null;
  const statusTone =
    status === "live"
      ? "success"
      : status === "reconnecting"
        ? "warning"
        : status === "disconnected"
          ? "error"
          : "info";
  const statusLabel =
    status === "live"
      ? "Live"
      : status === "reconnecting"
        ? "Reconnecting..."
        : status === "disconnected"
          ? "Disconnected"
          : "Connecting...";

  return (
    <SectionCard className="space-y-5">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Live Activity
          </div>

          <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                        Real-time platform events
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                        SSE events published by the backend to surface inbound messages,
                        retrieval progress, agent execution, delivery status and operational
                        failures as they happen.
          </p>

        </div>

        <div className="flex flex-wrap items-center gap-3">
                    <StatusPill tone={statusTone}>{statusLabel}</StatusPill>

          <a
            href={appLinks.grafana}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
                        Open Grafana
          </a>

        </div>

      </div>

      <div className="grid gap-3 md:grid-cols-3">

        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">

          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Live events
          </div>

          <div className="mt-2 text-2xl font-semibold text-slate-950">
                        {events.length}

          </div>

        </div>

        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">

          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Stream status
          </div>

          <div className="mt-2 text-lg font-semibold text-slate-950">
                        {statusLabel}

          </div>

        </div>

        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">

          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Latest event
          </div>

          <div className="mt-2 text-lg font-semibold text-slate-950">

            {latestEvent ? toLabel(latestEvent.type) : "No events yet"}

          </div>

        </div>

      </div>

      {events.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm text-slate-600">
                    No live activity yet.
        </div>
      ) : (
        <div className="space-y-3">

          {events.map((event, index) => {
            const style = EVENT_STYLES[event.color] ?? EVENT_STYLES.slate;
            const iconLabel = ICON_LABELS[event.icon ?? "activity"] ?? "ACT";

            return (
              <article
                key={`${event.executionId}-${event.eventType ?? event.type}-${event.timestamp}-${String(index)}`}
                className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
              >

                <div className="flex flex-wrap items-start justify-between gap-3">

                  <div className="flex min-w-0 items-start gap-3">

                    <span
                      className={`mt-1 inline-flex h-3 w-3 flex-none rounded-full ring-4 ${style.dot} ${style.ring}`}
                    />

                    <span className="inline-flex h-8 min-w-8 flex-none items-center justify-center rounded-2xl border border-slate-200 bg-white px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                                            {iconLabel}

                    </span>

                    <div className="min-w-0">

                      <div className="font-medium text-slate-950">
                                                {event.message}

                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">

                        <span>#{event.executionId}</span>
                                                <span>&bull;</span>

                        <span>{toLabel(event.type)}</span>

                        {event.channel ? (
                          <>
                                                        <span>&bull;</span>

                            <span>{event.channel}</span>

                          </>
                        ) : null}

                      </div>

                    </div>

                  </div>

                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">

                    {formatDate(event.timestamp, { locale: "pt-BR" })}

                  </div>

                </div>

                <div className="mt-3">

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${style.badge}`}
                  >
                                        {toLabel(event.type)}

                  </span>

                  {event.severity ? (
                    <span className="ml-2 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                            {event.severity}

                    </span>
                  ) : null}

                </div>

                {event.metadata ? (
                  <pre className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-xs text-slate-100">

                    {JSON.stringify(event.metadata, null, 2)}

                  </pre>
                ) : null}

              </article>
            );
          })}

        </div>
      )}

    </SectionCard>
  );
}
