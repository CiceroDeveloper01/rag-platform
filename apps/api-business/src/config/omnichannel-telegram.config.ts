import { registerAs } from '@nestjs/config';

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

export const omnichannelTelegramConfig = registerAs(
  'omnichannel.telegram',
  () => ({
    enabled: toBoolean(process.env.OMNICHANNEL_TELEGRAM_ENABLED, true),
    botToken: process.env.OMNICHANNEL_TELEGRAM_BOT_TOKEN ?? '',
    webhookSecret: process.env.OMNICHANNEL_TELEGRAM_WEBHOOK_SECRET ?? '',
    defaultParseMode:
      process.env.OMNICHANNEL_TELEGRAM_DEFAULT_PARSE_MODE ?? 'Markdown',
  }),
);
