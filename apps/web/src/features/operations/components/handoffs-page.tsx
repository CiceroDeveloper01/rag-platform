"use client";

import { useEffect, useState } from "react";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { PageHeader } from "@/src/components/ui/page-header";
import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";
import { operationsApiService } from "../services/operations-api.service";
import type { HandoffItem } from "../types/operations.types";

export function HandoffsPage() {
  const [items, setItems] = useState<HandoffItem[]>([]);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await operationsApiService.listHandoffs();
        if (active) {
          setItems(response.items);
          setSource(response.source);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Nao foi possivel carregar os handoffs.",
          );
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  if (!items.length && !error) {
    return (
      <LoadingPanel
        title="Consultando handoffs"
        description="Consolidando os atendimentos que exigiram escalacao humana."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Nao foi possivel abrir Handoffs"
        description={error}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Handoffs"
        title="Escalacoes humanas acompanhadas na Web"
        description="A area de handoff mostra quando a automacao para e a operacao humana entra no fluxo."
        actions={
          <StatusPill tone={source === "api" ? "success" : "warning"}>
            {source === "api" ? "Live data" : "Mock operacional"}
          </StatusPill>
        }
      />

      <section className="grid gap-5 md:grid-cols-2">
        {items.map((item) => (
          <SectionCard key={item.id} className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {item.channel}
                </div>
                <h2 className="mt-2 font-[family:var(--font-heading)] text-2xl font-semibold text-slate-950">
                  {item.customerName}
                </h2>
              </div>
              <StatusPill tone={item.status === "completed" ? "success" : "warning"}>
                {item.status}
              </StatusPill>
            </div>
            <p className="text-sm leading-7 text-slate-600">{item.reason}</p>
            <div className="grid gap-3 text-sm text-slate-600">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Queue:</span> {item.queue}
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="font-medium text-slate-950">Requested at:</span>{" "}
                {new Date(item.requestedAt).toLocaleString("pt-BR")}
              </div>
            </div>
          </SectionCard>
        ))}
      </section>
    </div>
  );
}
