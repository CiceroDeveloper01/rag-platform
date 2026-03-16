import Link from "next/link";
import { PageHeader } from "@/src/components/ui/page-header";
import { SectionCard } from "@/src/components/ui/section-card";
import { StatusPill } from "@/src/components/ui/status-pill";

const quickLinks = [
  {
    href: "/dashboard",
    title: "Operations Dashboard",
    description:
      "Tenha uma visao consolidada de status da API, documentos recentes e links operacionais do ambiente.",
  },
  {
    href: "/chat",
    title: "Conversational RAG",
    description:
      "Pergunte em linguagem natural e consulte o contexto recuperado pelo backend com embeddings e pgvector.",
  },
  {
    href: "/documents",
    title: "Document Ingestion",
    description:
      "Envie arquivos PDF e TXT para extracao, chunking, vetorizacao e persistencia automatica.",
  },
  {
    href: "/observability",
    title: "Operational Visibility",
    description:
      "Confira health check, links do Prometheus e Grafana e acompanhe a prontidao da plataforma.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">

      <PageHeader
        eyebrow="RAG Platform"
        title="Uma interface web para operar um backend RAG de ponta a ponta."
        description="Navegue entre dashboard, ingestao de documentos, chat com recuperacao vetorial e observabilidade em uma experiencia mais proxima de produto real."
      />

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">

        <SectionCard className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(60,94,255,0.18),_transparent_38%),linear-gradient(135deg,_rgba(9,16,32,0.98),_rgba(15,27,52,0.92))] text-slate-100">

          <div className="space-y-6">
                        <StatusPill tone="info">Ready for Retrieval</StatusPill>

            <div className="space-y-3">

              <h2 className="max-w-2xl font-[family:var(--font-heading)] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                Controle o ciclo completo do seu sistema RAG no navegador.

              </h2>

              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                                A interface foi estruturada por features para crescer com o
                                monorepo. Cada pagina consome a API via services dedicados, com
                                estados de loading, erro e sucesso preparados para um produto
                                real.
              </p>

            </div>

            <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">

              <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">

                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                                    Retrieval
                </div>

                <div className="mt-2 font-medium text-white">
                                    pgvector + search
                </div>

              </div>

              <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">

                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                                    Ingestion
                </div>

                <div className="mt-2 font-medium text-white">
                                    upload, parsing e chunking
                </div>

              </div>

              <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">

                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                                    Dashboard
                </div>

                <div className="mt-2 font-medium text-white">
                                    status, links e cards executivos

                </div>

              </div>

            </div>

          </div>

        </SectionCard>

        <SectionCard className="space-y-5">

          <div>

            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                            Platform Highlights
            </p>

            <h2 className="mt-3 font-[family:var(--font-heading)] text-2xl font-semibold tracking-tight text-slate-950">
                            O que ja esta conectado no backend
            </h2>

          </div>

          <ul className="space-y-3 text-sm leading-7 text-slate-600">

            <li className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                            Endpoints `/documents`, `/search`, `/chat`, `/health` e
                            `/metrics`.
            </li>

            <li className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                            Embeddings reais, busca vetorial no PostgreSQL + pgvector e
                            persistencia de queries.
            </li>

            <li className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                            Ingestao com upload, parser de PDF/TXT, chunking automatico e
                            observabilidade.
            </li>

            <li className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                            Frontend por features com streaming pronto para SSE, dashboard e
                            fallback elegante para endpoints futuros.

            </li>

          </ul>

        </SectionCard>

      </section>

      <section className="grid gap-5 lg:grid-cols-3">

        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href} className="group">

            <SectionCard className="h-full transition duration-200 group-hover:-translate-y-1 group-hover:border-slate-300 group-hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]">

              <div className="space-y-3">

                <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                                    Shortcut
                </div>

                <h3 className="font-[family:var(--font-heading)] text-xl font-semibold text-slate-950">
                                    {item.title}

                </h3>

                <p className="text-sm leading-7 text-slate-600">
                                    {item.description}

                </p>

                <div className="pt-2 text-sm font-medium text-sky-700">
                                    Abrir area
                  <span className="ml-2 inline-block transition group-hover:translate-x-1">
                                        →
                  </span>

                </div>

              </div>

            </SectionCard>

          </Link>
        ))}

      </section>

    </div>
  );
}
