import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseImapEmailProvider } from './imap.provider';

@Injectable()
export class YahooProvider extends BaseImapEmailProvider {
  constructor(configService: ConfigService) {
    super(configService, 'yahoo', {
      imapHost: 'imap.mail.yahoo.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.mail.yahoo.com',
      smtpPort: 465,
      smtpSecure: true,
    });
  }

  protected override getImapHost(): string {
    return (
      this.configService.get<string>('email.imap.host', '') ||
      'imap.mail.yahoo.com'
    );
  }

  protected override getSmtpHost(): string {
    return (
      this.configService.get<string>('email.smtp.host', '') ||
      'smtp.mail.yahoo.com'
    );
  }
}
