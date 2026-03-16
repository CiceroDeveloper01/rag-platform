import { registerAs } from '@nestjs/config';

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

export const omnichannelEmailConfig = registerAs('omnichannel.email', () => ({
  enabled: toBoolean(process.env.OMNICHANNEL_EMAIL_ENABLED, true),
  provider: process.env.OMNICHANNEL_EMAIL_PROVIDER ?? 'dev',
  from: process.env.OMNICHANNEL_EMAIL_FROM ?? 'no-reply@rag-platform.local',
  devMode: toBoolean(process.env.OMNICHANNEL_EMAIL_DEV_MODE, true),
}));
