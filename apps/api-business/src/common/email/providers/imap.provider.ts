import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import type {
  EmailProvider,
  EmailProviderHealth,
  InboundEmailMessage,
  SendEmailRequest,
  SendEmailResult,
} from '../interfaces/email-provider.interface';

export abstract class BaseImapEmailProvider implements EmailProvider {
  protected constructor(
    protected readonly configService: ConfigService,
    protected readonly providerName: string,
    private readonly defaults: {
      imapHost: string;
      imapPort: number;
      imapSecure: boolean;
      smtpHost: string;
      smtpPort: number;
      smtpSecure: boolean;
    },
  ) {}

  async receive(): Promise<InboundEmailMessage[]> {
    this.assertConfigured();
    const client = new ImapFlow({
      host: this.getImapHost(),
      port: this.getImapPort(),
      secure: this.getImapSecure(),
      auth: {
        user: this.getUsername(),
        pass: this.getPassword(),
      },
    });

    try {
      await client.connect();
      await client.mailboxOpen(this.getInbox());

      const messages: InboundEmailMessage[] = [];
      const unseenUids = (await client.search({ seen: false })) || [];

      for (const uid of unseenUids.slice(0, 10)) {
        for await (const message of client.fetch(String(uid), {
          uid: true,
          envelope: true,
          source: true,
          internalDate: true,
        })) {
          const parsed = await simpleParser(message.source);
          messages.push({
            provider: this.providerName,
            externalMessageId:
              parsed.messageId ??
              message.envelope?.messageId ??
              `${this.providerName}-${String(uid)}`,
            conversationId:
              parsed.inReplyTo?.trim() ||
              `${parsed.from?.text?.trim().toLowerCase() ?? 'unknown'}::${parsed.to?.text?.trim().toLowerCase() ?? this.getFromAddress().toLowerCase()}`,
            fromName: parsed.from?.value?.[0]?.name ?? undefined,
            fromEmail:
              parsed.from?.value?.[0]?.address?.trim().toLowerCase() ??
              this.getUsername(),
            toEmail:
              parsed.to?.value?.[0]?.address?.trim().toLowerCase() ??
              this.getFromAddress().toLowerCase(),
            subject: parsed.subject ?? undefined,
            body: parsed.text?.trim() || parsed.html || '',
            html: parsed.html ? String(parsed.html) : undefined,
            metadata: {
              provider: this.providerName,
              uid: message.uid,
              receivedAt:
                message.internalDate instanceof Date
                  ? message.internalDate.toISOString()
                  : message.internalDate,
              headers: {
                messageId: parsed.messageId,
                inReplyTo: parsed.inReplyTo,
              },
            },
          });
        }

        await client.messageFlagsAdd(String(uid), ['\\Seen']);
      }

      return messages.filter((message) => message.body.trim().length > 0);
    } finally {
      await client.logout().catch(() => undefined);
    }
  }

  async send(payload: SendEmailRequest): Promise<SendEmailResult> {
    this.assertConfigured();
    const transporter = nodemailer.createTransport({
      host: this.getSmtpHost(),
      port: this.getSmtpPort(),
      secure: this.getSmtpSecure(),
      auth: {
        user: this.getUsername(),
        pass: this.getPassword(),
      },
    });

    const info = await transporter.sendMail({
      from: payload.from ?? this.getFromAddress(),
      to: payload.to,
      subject: payload.subject ?? 'RAG Platform response',
      text: payload.text,
      html: payload.html,
      headers: payload.metadata,
    });

    return {
      accepted: info.accepted.length > 0,
      externalId: info.messageId,
      metadata: {
        rejected: info.rejected,
        response: info.response,
        envelope: info.envelope,
      },
    };
  }

  async health(): Promise<EmailProviderHealth> {
    if (!this.isConfigured()) {
      return {
        status: 'disabled',
        provider: this.providerName,
      };
    }

    const transporter = nodemailer.createTransport({
      host: this.getSmtpHost(),
      port: this.getSmtpPort(),
      secure: this.getSmtpSecure(),
      auth: {
        user: this.getUsername(),
        pass: this.getPassword(),
      },
      connectionTimeout: 5_000,
    });

    try {
      await transporter.verify();
      return {
        status: 'up',
        provider: this.providerName,
        details: {
          inbox: this.getInbox(),
          smtpHost: this.getSmtpHost(),
          imapHost: this.getImapHost(),
        },
      };
    } catch (error) {
      return {
        status: 'down',
        provider: this.providerName,
        details: {
          reason:
            error instanceof Error
              ? error.message
              : 'email_provider_unavailable',
        },
      };
    }
  }

  protected isConfigured(): boolean {
    return Boolean(
      this.getUsername() && this.getPassword() && this.getFromAddress(),
    );
  }

  protected assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        `Email provider "${this.providerName}" is not fully configured`,
      );
    }
  }

  protected getImapHost(): string {
    return (
      this.configService.get<string>('email.imap.host', '') ||
      this.defaults.imapHost
    );
  }

  protected getImapPort(): number {
    return this.configService.get<number>(
      'email.imap.port',
      this.defaults.imapPort,
    );
  }

  protected getImapSecure(): boolean {
    return this.configService.get<boolean>(
      'email.imap.secure',
      this.defaults.imapSecure,
    );
  }

  protected getSmtpHost(): string {
    return (
      this.configService.get<string>('email.smtp.host', '') ||
      this.defaults.smtpHost
    );
  }

  protected getSmtpPort(): number {
    return this.configService.get<number>(
      'email.smtp.port',
      this.defaults.smtpPort,
    );
  }

  protected getSmtpSecure(): boolean {
    return this.configService.get<boolean>(
      'email.smtp.secure',
      this.defaults.smtpSecure,
    );
  }

  protected getUsername(): string {
    return this.configService.get<string>('email.username', '');
  }

  protected getPassword(): string {
    return this.configService.get<string>('email.password', '');
  }

  protected getInbox(): string {
    return this.configService.get<string>('email.inbox', 'INBOX');
  }

  protected getFromAddress(): string {
    return this.configService.get<string>('email.fromAddress', '');
  }
}

export class ImapProvider extends BaseImapEmailProvider {
  constructor(configService: ConfigService) {
    super(configService, 'imap', {
      imapHost: '',
      imapPort: 993,
      imapSecure: true,
      smtpHost: '',
      smtpPort: 465,
      smtpSecure: true,
    });
  }
}
