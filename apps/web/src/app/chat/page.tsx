import { PageHeader } from "@/src/components/ui/page-header";
import { ChatExperience } from "@/src/features/chat/components/chat-experience";

export default function ChatPage() {
  return (
    <div className="space-y-8">

      <PageHeader
        eyebrow="Chat"
        title="Converse com o seu conhecimento ingerido."
        description="Envie perguntas ao backend RAG, acompanhe a resposta em streaming e visualize os chunks recuperados diretamente na conversa."
      />

      <ChatExperience />

    </div>
  );
}
