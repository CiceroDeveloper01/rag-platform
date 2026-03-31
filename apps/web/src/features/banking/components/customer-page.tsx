"use client";

import { useEffect, useState } from "react";
import { ErrorState } from "@/src/components/states/error-state";
import { LoadingPanel } from "@/src/components/states/loading-panel";
import { PageHeader } from "@/src/components/ui/page-header";
import { SectionCard } from "@/src/components/ui/section-card";
import { bankingApiService } from "../services/banking-api.service";
import type { CustomerProfile, CustomerSummary } from "../types/banking.types";
import { ContextualAssistantPanel } from "./contextual-assistant-panel";
import { SourceBadge } from "./source-badge";

export function CustomerPage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [profileResponse, summaryResponse] = await Promise.all([
          bankingApiService.getCustomerProfile(),
          bankingApiService.getCustomerSummary(),
        ]);

        if (!isMounted) {
          return;
        }

        setProfile(profileResponse.data);
        setSummary(summaryResponse.data);
        setSource(
          profileResponse.source === "api" && summaryResponse.source === "api"
            ? "api"
            : "mock",
        );
      } catch (requestError) {
        if (!isMounted) {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel carregar o perfil do cliente.",
        );
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!profile || !summary) {
    if (error) {
      return <ErrorState title="Nao foi possivel carregar o cliente" description={error} />;
    }

    return (
      <LoadingPanel
        title="Carregando cliente"
        description="Buscando perfil bancario e resumo de relacionamento."
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Customer"
        title="Perfil do cliente e relacionamento financeiro"
        description="A experiencia de cliente agora aparece como modulo de produto, nao como retorno isolado de tool."
        actions={<SourceBadge source={source} />}
      />

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6">
          <SectionCard className="space-y-5">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Perfil bancario
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Nome
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">
                  {profile.fullName}
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Segmento
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">
                  {profile.segment}
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  E-mail
                </div>
                <div className="mt-3 text-lg font-semibold text-slate-950">
                  {profile.email}
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Relacionamento
                </div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">
                  {profile.relationshipStatus}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard className="space-y-5">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Resumo do cliente
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-5">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Produtos ativos
                </div>
                <div className="mt-3 text-3xl font-semibold text-slate-950">
                  {summary.activeProducts}
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-5">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Total de contas
                </div>
                <div className="mt-3 text-3xl font-semibold text-slate-950">
                  {summary.totalAccounts}
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-5">
                <div className="text-sm text-slate-600">
                  Cartao de credito ativo
                </div>
                <div className="mt-2 text-xl font-semibold text-slate-950">
                  {summary.hasCreditCard ? "Sim" : "Nao"}
                </div>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-5">
                <div className="text-sm text-slate-600">
                  Possui investimentos
                </div>
                <div className="mt-2 text-xl font-semibold text-slate-950">
                  {summary.hasInvestments ? "Sim" : "Nao"}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <ContextualAssistantPanel
          title="Assistente do cliente"
          contextLabel="Cliente"
          contextSummary={`Cliente ${profile.fullName}, segmento ${profile.segment}, ${summary.activeProducts} produtos ativos e ${summary.totalAccounts} contas.`}
          suggestions={[
            "Resuma o relacionamento do cliente",
            "Quais modulos bancarios fazem mais sentido para este perfil?",
            "Como o sistema usa esse contexto em outras telas?",
          ]}
        />
      </section>
    </div>
  );
}
