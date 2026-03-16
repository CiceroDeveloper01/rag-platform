import { EmptyState } from "@/src/components/ui/empty-state";
import type { Conversation } from "../types/chat.types";
import { ConversationListItem } from "./conversation-list-item";

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
}: {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
}) {
  if (conversations.length === 0) {
    return (
      <EmptyState
        title="Nenhuma conversa salva"
        description="Assim que voce enviar mensagens, o historico fica persistido localmente para a demo."
      />
    );
  }

  return (
    <div className="space-y-3">

      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          isActive={String(conversation.id) === activeConversationId}
          onClick={() => onSelectConversation(String(conversation.id))}
          onDelete={() => onDeleteConversation(String(conversation.id))}
        />
      ))}

    </div>
  );
}
