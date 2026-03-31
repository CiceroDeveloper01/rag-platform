import Link from "next/link";
import { PageHeader } from "@/src/components/ui/page-header";
import { SectionCard } from "@/src/components/ui/section-card";

const quickLinks = [
  {
    href: "/cards",
    title: "Cartoes",
    description:
      "Acesse status, limite, fatura e operacoes sensiveis de cartao em um modulo com cara de internet banking.",
  },
  {
    href: "/credit",
    title: "Credito",
    description:
      "Consulte limite pre-aprovado, contratos e rode simulacoes de proposta em uma jornada mais financeira.",
  },
  {
    href: "/investments",
    title: "Investimentos",
    description:
      "Veja produtos, carteira e simulacoes com o assistente inteligente contextualizado.",
  },
  {
    href: "/conversations",
    title: "Conversations",
    description:
      "Acompanhe sessoes reais de Web, WhatsApp e Telegram com detalhes operacionais e estado do fluxo.",
  },
  {
    href: "/conversation-simulator",
    title: "Simulator",
    description:
      "Teste interacoes por canal e contexto em um ambiente controlado para validacao e portfólio.",
  },
  {
    href: "/observability",
    title: "Monitorias",
    description:
      "Acompanhe health, latencia, throughput, consumo de IA e sinais de operacao da plataforma.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">

      <PageHeader
        eyebrow="Intelligent automation platform"
        title="Um portal bancario digital com assistente inteligente e operacao observavel."
        description="A home agora apresenta o produto como banco digital moderno: modulos de negocio, assistente embutido e monitorias que demonstram maturidade tecnica."
      />

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">

        <SectionCard className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_36%),linear-gradient(135deg,_rgba(5,21,31,0.98),_rgba(8,47,73,0.96))] text-slate-100">

          <div className="space-y-6">

            <div className="space-y-3">

              <h2 className="max-w-2xl font-[family:var(--font-heading)] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                Banking, assistant e monitorias na mesma experiencia.

              </h2>

              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                                A navegacao deixa de priorizar chat e passa a organizar o
                                frontend como produto financeiro. Cartoes, credito,
                                investimentos, cliente e monitorias viram modulos principais,
                                enquanto o assistente entra como apoio contextual.
              </p>

            </div>

            <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">

              <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">

                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                                    Banking
                </div>

                <div className="mt-2 font-medium text-white">
                                    cartoes, credito e investimentos
                </div>

              </div>

              <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">

                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                                    Assistant
                </div>

                <div className="mt-2 font-medium text-white">
                                    contexto por tela e suporte orientado ao produto
                </div>

              </div>

              <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">

                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                                    Monitorias
                </div>

                <div className="mt-2 font-medium text-white">
                                    health, latencia e throughput operacional

                </div>

              </div>

            </div>

          </div>

        </SectionCard>

        <SectionCard className="space-y-5">

          <div>

            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
                            Platform highlights
            </p>

            <h2 className="mt-3 font-[family:var(--font-heading)] text-2xl font-semibold tracking-tight text-slate-950">
                            O que ja sustenta a experiencia bancaria
            </h2>

          </div>

          <ul className="space-y-3 text-sm leading-7 text-slate-600">

            <li className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                            Banking em `api-business`, orchestrator com specialists,
                            tools, guardrails, handoff e monitorias.
            </li>

            <li className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                            Integracoes reais para perfil, cartoes, credito e
                            investimentos, com fallback coerente quando a boundary web
                            ainda nao expoe tudo.
            </li>

            <li className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                            Observabilidade com health, throughput, latencia, custo de IA
                            e diferenciacao entre fluxo deterministico e assistido por
                            conhecimento.
            </li>

            <li className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                            Frontend modular por dominio, reutilizando shell, graficos e
                            services existentes para parecer produto e nao laboratorio.

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
