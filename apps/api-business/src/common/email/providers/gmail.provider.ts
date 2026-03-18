import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseImapEmailProvider } from './imap.provider';

@Injectable()
export class GmailProvider extends BaseImapEmailProvider {
  constructor(configService: ConfigService) {
    super(configService, 'gmail', {
      imapHost: 'imap.gmail.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465,
      smtpSecure: true,
    });
  }

  protected override getImapHost(): string {
    return (
      this.configService.get<string>('email.imap.host', '') || 'imap.gmail.com'
    );
  }

  protected override getSmtpHost(): string {
    return (
      this.configService.get<string>('email.smtp.host', '') || 'smtp.gmail.com'
    );
  }
}
