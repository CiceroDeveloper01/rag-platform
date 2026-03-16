import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TelegramCommandService {
  constructor(private readonly configService: ConfigService) {}

  resolve(text: string): string | null {
    const command = normalizeCommand(text);
    if (!command) {
      return null;
    }

    const botUsername =
      this.configService
        .get<string>("listeners.telegram.botUsername")
        ?.trim() || "rag_platform_bot";

    switch (command) {
      case "/start":
        return `Hello, I am @${botUsername}. Send "hello" to test the platform or use /help to see available commands.`;
      case "/status":
        return "Platform status: operational. Inbound queue, orchestrator, RAG and Telegram outbound are available.";
      case "/help":
        return [
          "/start - welcome message",
          "/status - platform status",
          "/help - available commands",
        ].join("\n");
      default:
        return null;
    }
  }
}

function normalizeCommand(text: string): string | null {
  const value = text.trim().split(/\s+/)[0]?.toLowerCase();
  if (!value?.startsWith("/")) {
    return null;
  }

  return value;
}
