import { EmptyState } from "@/src/components/ui/empty-state";

export function ChatEmptyState() {
  return (
    <div className="px-4 py-5 sm:px-6">

      <EmptyState
        title="Comece uma conversa com o seu RAG"
        description="Envie uma pergunta para o endpoint /chat e acompanhe a resposta ser construida progressivamente."
      />

    </div>
  );
}
