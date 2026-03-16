import { PageHeader } from "@/src/components/ui/page-header";
import { ObservabilityOverview } from "@/src/features/observability/components/observability-overview";

export default function ObservabilityPage() {
  return (
    <div className="space-y-8">

      <PageHeader
        eyebrow="Observability"
        title="Visibilidade operacional do ambiente RAG."
        description="Consulte o health check da API, atualize o status manualmente e acesse rapidamente os pontos-chave de observabilidade da stack local."
      />

      <ObservabilityOverview />

    </div>
  );
}
