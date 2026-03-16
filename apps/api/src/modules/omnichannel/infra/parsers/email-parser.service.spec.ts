import { EmailParserService } from './email-parser.service';

describe('EmailParserService', () => {
  it('builds a stable parsed email payload for the dev provider', () => {
    const service = new EmailParserService();

    const result = service.parse({
      fromName: 'Sender',
      fromEmail: 'Sender@Example.com',
      toEmail: 'Support@Example.com',
      subject: '  Policy update  ',
      body: '  The new policy is attached.  ',
    });

    expect(result).toEqual(
      expect.objectContaining({
        conversationId: 'sender@example.com::support@example.com',
        subject: 'Policy update',
        body: 'The new policy is attached.',
        senderName: 'Sender',
        senderAddress: 'sender@example.com',
        recipientAddress: 'support@example.com',
      }),
    );
  });
});
