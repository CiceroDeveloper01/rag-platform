import { ConfigService } from '@nestjs/config';
import { MetricsService, AppLoggerService } from '@rag-platform/observability';
import { DocumentIngestionConsumerService } from './document-ingestion.consumer';
import { DocumentIngestionWorkerService } from './document-ingestion.worker';

describe('DocumentIngestionConsumerService', () => {
  it('consumes a message, delegates processing, and acknowledges it', async () => {
    const ack = jest.fn();
    const workerService = {
      process: jest.fn().mockResolvedValue(undefined),
    } as unknown as DocumentIngestionWorkerService;

    const service = new DocumentIngestionConsumerService(
      {
        getOrThrow: jest.fn().mockReturnValue('document.ingestion.requested'),
        get: jest.fn((key: string, fallback?: unknown) => fallback),
      } as unknown as ConfigService,
      {
        log: jest.fn(),
        error: jest.fn(),
      } as unknown as AppLoggerService,
      {
        increment: jest.fn(),
      } as unknown as MetricsService,
      workerService,
    );

    Object.assign(service, {
      channel: {
        ack,
      },
    });

    await service.handleMessage({
      content: Buffer.from(
        JSON.stringify({
          sourceId: 3,
          tenantId: 'tenant-acme',
          filename: 'guide.pdf',
          mimeType: 'application/pdf',
          storageKey: 'docs/guide.pdf',
          storageUrl: 'file:///docs/guide.pdf',
          fileContentBase64: Buffer.from('hello').toString('base64'),
          uploadedAt: new Date().toISOString(),
        }),
      ),
    } as never);

    expect(workerService.process).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: 3,
        tenantId: 'tenant-acme',
      }),
    );
    expect(ack).toHaveBeenCalled();
  });
});
