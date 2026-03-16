import { EmailParserService } from '../../../parsers/email-parser.service';
import { EmailMessageNormalizer } from './email-message-normalizer.service';

describe('EmailMessageNormalizer', () => {
  it('maps a dev email payload into the normalized omnichannel payload', () => {
    const service = new EmailMessageNormalizer(new EmailParserService());

    const payload = service.normalizeInbound({
      fromName: 'Equipe Docs',
      fromEmail: 'docs@rag-platform.dev',
      toEmail: 'support@rag-platform.dev',
      subject: 'Manual atualizado',
      body: 'Segue o manual atualizado.',
      externalMessageId: 'mail-1',
      metadata: {
        thread: 'abc',
      },
    });

    expect(payload.toObject()).toEqual(
      expect.objectContaining({
        externalMessageId: 'mail-1',
        senderName: 'Equipe Docs',
        senderAddress: 'docs@rag-platform.dev',
        recipientAddress: 'support@rag-platform.dev',
        subject: 'Manual atualizado',
        body: 'Segue o manual atualizado.',
      }),
    );
    expect(payload.toObject().metadata).toEqual(
      expect.objectContaining({
        provider: 'dev',
        from: 'docs@rag-platform.dev',
        to: 'support@rag-platform.dev',
        thread: 'abc',
      }),
    );
  });
});
