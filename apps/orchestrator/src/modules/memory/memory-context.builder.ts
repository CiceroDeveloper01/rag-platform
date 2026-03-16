import { Injectable } from "@nestjs/common";
import { SupportedAgentLanguage } from "../agents/language-detection.service";
import { ConversationMemoryRecord } from "./memory.repository";

@Injectable()
export class MemoryContextBuilder {
  buildContext(params: {
    recentMessages: ConversationMemoryRecord[];
    semanticMemories: ConversationMemoryRecord[];
    userQuestion: string;
    language?: SupportedAgentLanguage;
  }): string {
    const {
      recentMessages,
      semanticMemories,
      userQuestion,
      language = "pt",
    } = params;
    const copy = labels(language);

    const recentSection = recentMessages.length
      ? recentMessages
          .map(
            (memory) =>
              `[${memory.role.toUpperCase()} @ ${memory.createdAt}] ${memory.message}`,
          )
          .join("\n")
      : copy.noRecentHistory;

    const semanticSection = semanticMemories.length
      ? semanticMemories
          .map(
            (memory, index) =>
              `${copy.memory} ${index + 1}: [${memory.role}] ${memory.message}`,
          )
          .join("\n")
      : copy.noSemanticMemories;

    return [
      copy.userQuestion,
      userQuestion,
      "",
      copy.recentHistory,
      recentSection,
      "",
      copy.semanticMemories,
      semanticSection,
    ].join("\n");
  }
}

function labels(language: SupportedAgentLanguage) {
  switch (language) {
    case "en":
      return {
        userQuestion: "USER QUESTION:",
        recentHistory: "RECENT HISTORY:",
        semanticMemories: "SEMANTIC MEMORIES:",
        memory: "MEMORY",
        noRecentHistory: "No recent conversation history.",
        noSemanticMemories: "No semantic memories matched this question.",
      };
    case "es":
      return {
        userQuestion: "PREGUNTA DEL USUARIO:",
        recentHistory: "HISTORIAL RECIENTE:",
        semanticMemories: "MEMORIAS SEMANTICAS:",
        memory: "MEMORIA",
        noRecentHistory: "No hay historial reciente de la conversación.",
        noSemanticMemories:
          "Ninguna memoria semántica coincidió con esta pregunta.",
      };
    case "pt":
    default:
      return {
        userQuestion: "PERGUNTA DO USUARIO:",
        recentHistory: "HISTORICO RECENTE:",
        semanticMemories: "MEMORIAS SEMANTICAS:",
        memory: "MEMORIA",
        noRecentHistory: "Nao ha historico recente da conversa.",
        noSemanticMemories:
          "Nenhuma memoria semantica correspondeu a esta pergunta.",
      };
  }
}
