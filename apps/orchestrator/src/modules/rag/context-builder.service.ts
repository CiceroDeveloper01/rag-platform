import { Injectable } from "@nestjs/common";
import { RagDocumentRecord } from "./vector.repository";
import { SupportedAgentLanguage } from "../agents/language-detection.service";

@Injectable()
export class ContextBuilderService {
  buildContext(
    question: string,
    retrievedDocuments: RagDocumentRecord[],
    language: SupportedAgentLanguage = "pt",
  ): string {
    if (retrievedDocuments.length === 0) {
      return [
        labels(language).question,
        question,
        "",
        labels(language).context,
        labels(language).noDocuments,
      ].join("\n");
    }

    const serializedDocuments = retrievedDocuments.map((document, index) => {
      return [
        `${labels(language).document} ${index + 1}`,
        `${labels(language).source}: ${document.source}`,
        document.content,
      ].join("\n");
    });

    return [
      labels(language).question,
      question,
      "",
      labels(language).context,
      ...serializedDocuments,
    ].join("\n\n");
  }
}

function labels(language: SupportedAgentLanguage) {
  switch (language) {
    case "en":
      return {
        question: "QUESTION:",
        context: "CONTEXT:",
        noDocuments: "No relevant documents were retrieved.",
        document: "DOCUMENT",
        source: "Source",
      };
    case "es":
      return {
        question: "PREGUNTA:",
        context: "CONTEXTO:",
        noDocuments: "No se recuperaron documentos relevantes.",
        document: "DOCUMENTO",
        source: "Origen",
      };
    case "pt":
    default:
      return {
        question: "PERGUNTA:",
        context: "CONTEXTO:",
        noDocuments: "Nenhum documento relevante foi recuperado.",
        document: "DOCUMENTO",
        source: "Origem",
      };
  }
}
