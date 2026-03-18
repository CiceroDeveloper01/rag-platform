import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { EmailProvider } from './interfaces/email-provider.interface';
import { GmailProvider } from './providers/gmail.provider';
import { ImapProvider } from './providers/imap.provider';
import { MockProvider } from './providers/mock.provider';
import { OutlookProvider } from './providers/outlook.provider';
import { YahooProvider } from './providers/yahoo.provider';
import { EMAIL_PROVIDER } from './email.constants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    GmailProvider,
    OutlookProvider,
    YahooProvider,
    ImapProvider,
    MockProvider,
    {
      provide: EMAIL_PROVIDER,
      inject: [
        ConfigService,
        GmailProvider,
        OutlookProvider,
        YahooProvider,
        ImapProvider,
        MockProvider,
      ],
      useFactory: (
        configService: ConfigService,
        gmailProvider: GmailProvider,
        outlookProvider: OutlookProvider,
        yahooProvider: YahooProvider,
        imapProvider: ImapProvider,
        mockProvider: MockProvider,
      ): EmailProvider => {
        switch (configService.get<string>('email.provider', 'mock')) {
          case 'gmail':
            return gmailProvider;
          case 'outlook':
            return outlookProvider;
          case 'yahoo':
            return yahooProvider;
          case 'imap':
            return imapProvider;
          case 'mock':
          default:
            return mockProvider;
        }
      },
    },
  ],
  exports: [EMAIL_PROVIDER],
})
export class EmailModule {}
