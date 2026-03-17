import { registerAs } from '@nestjs/config';

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

export const emailConfig = registerAs('email', () => ({
  provider: (
    process.env.EMAIL_PROVIDER ??
    process.env.OMNICHANNEL_EMAIL_PROVIDER ??
    'mock'
  )
    .trim()
    .toLowerCase(),
  imap: {
    host: process.env.EMAIL_IMAP_HOST ?? '',
    port: Number.parseInt(process.env.EMAIL_IMAP_PORT ?? '993', 10),
    secure: toBoolean(process.env.EMAIL_IMAP_SECURE, true),
  },
  smtp: {
    host: process.env.EMAIL_SMTP_HOST ?? '',
    port: Number.parseInt(process.env.EMAIL_SMTP_PORT ?? '465', 10),
    secure: toBoolean(process.env.EMAIL_SMTP_SECURE, true),
  },
  username: process.env.EMAIL_USERNAME ?? '',
  password: process.env.EMAIL_PASSWORD ?? '',
  pollIntervalSeconds: Number.parseInt(
    process.env.EMAIL_POLL_INTERVAL_SECONDS ?? '30',
    10,
  ),
  inbox: process.env.EMAIL_INBOX ?? 'INBOX',
  fromAddress:
    process.env.EMAIL_FROM_ADDRESS ??
    process.env.OMNICHANNEL_EMAIL_FROM ??
    'no-reply@rag-platform.local',
  maxAttachmentMb: Number.parseInt(
    process.env.EMAIL_MAX_ATTACHMENT_MB ?? '10',
    10,
  ),
}));
