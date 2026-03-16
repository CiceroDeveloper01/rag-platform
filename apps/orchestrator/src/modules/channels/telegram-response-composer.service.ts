import { Injectable } from "@nestjs/common";
import { FlowExecutionPayload } from "../queue/flow-execution.types";
import { TelegramCommandService } from "./telegram-command.service";

@Injectable()
export class TelegramResponseComposerService {
  constructor(
    private readonly telegramCommandService: TelegramCommandService,
  ) {}

  compose(payload: FlowExecutionPayload): string {
    const body = this.extractString(payload.context?.body);
    const commandResponse = body
      ? this.telegramCommandService.resolve(body)
      : null;

    if (commandResponse) {
      return commandResponse;
    }

    if (body && normalizeText(body) === "hello") {
      return "hello from RAG platform";
    }

    const explicitResponse = this.extractString(payload.context?.responseText);
    if (explicitResponse) {
      return explicitResponse;
    }

    const language = this.extractLanguage(payload);
    switch (language) {
      case "en":
        return "We received your message and processed it successfully.";
      case "es":
        return "Recibimos tu mensaje y la plataforma lo proceso correctamente.";
      case "pt":
      default:
        return "Recebemos sua mensagem e a plataforma a processou com sucesso.";
    }
  }

  resolveRecipientId(payload: FlowExecutionPayload): string {
    const metadata = payload.context?.metadata as
      | Record<string, unknown>
      | undefined;
    const chatId = metadata?.telegramChatId;
    if (typeof chatId === "string" || typeof chatId === "number") {
      return String(chatId);
    }

    const conversationId = this.extractString(payload.context?.conversationId);
    if (conversationId) {
      return conversationId;
    }

    throw new Error(
      "Telegram recipient chat id is missing from flow execution context",
    );
  }

  private extractLanguage(payload: FlowExecutionPayload): "pt" | "en" | "es" {
    const language = this.extractString(payload.context?.language);
    if (language === "en" || language === "es") {
      return language;
    }

    return "pt";
  }

  private extractString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase();
}
