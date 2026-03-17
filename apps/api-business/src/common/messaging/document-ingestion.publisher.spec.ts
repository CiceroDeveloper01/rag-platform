import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { TracingService } from '../observability/services/tracing.service';
import { DocumentIngestionPublisherService } from './document-ingestion.publisher';

describe('DocumentIngestionPublisherService', () => {
  it('publishes document ingestion requests to the configured exchange', async () => {
    const publish = jest.fn();
    const service = new DocumentIngestionPublisherService(
      {
        getOrThrow: jest.fn((key: string) => {
          if (key === 'rabbitmq.exchange') {
            return 'documents.ingestion';
          }
          if (key === 'rabbitmq.routingKey') {
            return 'document.ingestion.requested';
          }
          return 'amqp://guest:guest@localhost:5672';
        }),
        get: jest.fn(),
      } as unknown as ConfigService,
      {
        runInSpan: jest.fn(async (_name, operation) => operation()),
      } as unknown as TracingService,
      {
        setContext: jest.fn(),
        info: jest.fn(),
      } as unknown as PinoLogger,
    );

    Object.assign(service, {
      getChannel: jest.fn().mockResolvedValue({
        publish,
        waitForConfirms: jest.fn().mockResolvedValue(undefined),
      }),
    });

    await service.publish({
      eventId: 'evt-1',
      correlationId: 'corr-1',
      sourceId: 7,
      tenantId: 'tenant-acme',
      filename: 'manual.pdf',
      mimeType: 'application/pdf',
      storageKey: 'stored/manual.pdf',
      storageUrl: 'file:///stored/manual.pdf',
      fileContentBase64: Buffer.from('hello').toString('base64'),
      uploadedAt: new Date().toISOString(),
    });

    expect(publish).toHaveBeenCalledWith(
      'documents.ingestion',
      'document.ingestion.requested',
      expect.any(Buffer),
      expect.objectContaining({
        persistent: true,
        type: 'document.ingestion.requested',
        messageId: 'evt-1',
        correlationId: 'corr-1',
      }),
    );
  });
});
