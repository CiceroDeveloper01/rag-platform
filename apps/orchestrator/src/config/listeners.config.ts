import { registerAs } from "@nestjs/config";

export const listenersConfig = registerAs("listeners", () => ({
  email: {
    enabled: (process.env.EMAIL_LISTENER_ENABLED ?? "true") === "true",
    mode: process.env.EMAIL_LISTENER_MODE ?? "manual",
    pollIntervalMs: Number(
      process.env.EMAIL_LISTENER_POLL_INTERVAL_MS ?? 30_000,
    ),
    apiBaseUrl: process.env.EMAIL_LISTENER_API_BASE_URL ?? "",
    apiToken: process.env.EMAIL_LISTENER_API_TOKEN ?? "",
    outboundPath: process.env.EMAIL_LISTENER_OUTBOUND_PATH ?? "/messages/send",
    timeoutMs: Number(process.env.EMAIL_LISTENER_TIMEOUT_MS ?? 10_000),
    retryEnabled:
      (process.env.EMAIL_LISTENER_RETRY_ENABLED ?? "true") === "true",
    retryMaxAttempts: Number(
      process.env.EMAIL_LISTENER_RETRY_MAX_ATTEMPTS ?? 3,
    ),
    retryInitialDelayMs: Number(
      process.env.EMAIL_LISTENER_RETRY_INITIAL_DELAY_MS ?? 250,
    ),
    retryMaxDelayMs: Number(
      process.env.EMAIL_LISTENER_RETRY_MAX_DELAY_MS ?? 2_000,
    ),
  },
  telegram: {
    enabled:
      (process.env.TELEGRAM_LISTENER_ENABLED ??
        process.env.TELEGRAM_ENABLED ??
        "true") === "true",
    botToken:
      process.env.TELEGRAM_LISTENER_BOT_TOKEN ??
      process.env.TELEGRAM_BOT_TOKEN ??
      "",
    botUsername:
      process.env.TELEGRAM_LISTENER_BOT_USERNAME ??
      process.env.TELEGRAM_BOT_USERNAME ??
      "",
    mode: process.env.TELEGRAM_LISTENER_MODE ?? "polling",
    pollingIntervalMs: Number(
      process.env.TELEGRAM_LISTENER_POLLING_INTERVAL_MS ?? 10_000,
    ),
    webhookSecret: process.env.TELEGRAM_LISTENER_WEBHOOK_SECRET ?? "",
    apiBaseUrl:
      process.env.TELEGRAM_LISTENER_API_BASE_URL ?? "https://api.telegram.org",
    timeoutMs: Number(process.env.TELEGRAM_LISTENER_TIMEOUT_MS ?? 10_000),
    retryEnabled:
      (process.env.TELEGRAM_LISTENER_RETRY_ENABLED ?? "true") === "true",
    retryMaxAttempts: Number(
      process.env.TELEGRAM_LISTENER_RETRY_MAX_ATTEMPTS ?? 3,
    ),
    retryInitialDelayMs: Number(
      process.env.TELEGRAM_LISTENER_RETRY_INITIAL_DELAY_MS ?? 250,
    ),
    retryMaxDelayMs: Number(
      process.env.TELEGRAM_LISTENER_RETRY_MAX_DELAY_MS ?? 2_000,
    ),
  },
  whatsapp: {
    enabled: (process.env.WHATSAPP_LISTENER_ENABLED ?? "true") === "true",
    mode: process.env.WHATSAPP_LISTENER_MODE ?? "manual",
    apiBaseUrl: process.env.WHATSAPP_LISTENER_API_BASE_URL ?? "",
    apiToken: process.env.WHATSAPP_LISTENER_API_TOKEN ?? "",
    outboundPath: process.env.WHATSAPP_LISTENER_OUTBOUND_PATH ?? "/messages",
    timeoutMs: Number(process.env.WHATSAPP_LISTENER_TIMEOUT_MS ?? 10_000),
    retryEnabled:
      (process.env.WHATSAPP_LISTENER_RETRY_ENABLED ?? "true") === "true",
    retryMaxAttempts: Number(
      process.env.WHATSAPP_LISTENER_RETRY_MAX_ATTEMPTS ?? 3,
    ),
    retryInitialDelayMs: Number(
      process.env.WHATSAPP_LISTENER_RETRY_INITIAL_DELAY_MS ?? 250,
    ),
    retryMaxDelayMs: Number(
      process.env.WHATSAPP_LISTENER_RETRY_MAX_DELAY_MS ?? 2_000,
    ),
  },
}));
