import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseImapEmailProvider } from './imap.provider';

@Injectable()
export class OutlookProvider extends BaseImapEmailProvider {
  constructor(configService: ConfigService) {
    super(configService, 'outlook', {
      imapHost: 'outlook.office365.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.office365.com',
      smtpPort: 587,
      smtpSecure: false,
    });
  }

  protected override getImapHost(): string {
    return (
      this.configService.get<string>('email.imap.host', '') ||
      'outlook.office365.com'
    );
  }

  protected override getSmtpHost(): string {
    return (
      this.configService.get<string>('email.smtp.host', '') ||
      'smtp.office365.com'
    );
  }

  protected override getSmtpPort(): number {
    return this.configService.get<number>('email.smtp.port', 587);
  }

  protected override getSmtpSecure(): boolean {
    return this.configService.get<boolean>('email.smtp.secure', false);
  }
}
