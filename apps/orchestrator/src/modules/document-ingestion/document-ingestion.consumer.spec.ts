import { ConfigService } from '@nestjs/config';
import { MetricsService, AppLoggerService } from '@rag-platform/observability';
import { DocumentIngestionInternalClient } from '@rag-platform/sdk';
import { DocumentIngestionConsumerService } from './document-ingestion.consumer';
import { DocumentIngestionWorkerService } from './document-ingestion.worker';

function createConfigService(): ConfigService {
  const values: Record<string, unknown> = {
    'rabbitmq.queue': 'document.ingestion.requested',
    'rabbitmq.retryExchange': 'documents.ingestion.retry',
    'rabbitmq.retryRoutingKey': 'document.ingestion.requested.retry',
    'rabbitmq.deadLetterExchange': 'documents.ingestion.dlx',
    'rabbitmq.deadLetterRoutingKey': 'document.ingestion.requested.dead',
    'rabbitmq.maxAttempts': 3,
  };

  return {
    getOrThrow: jest.fn((key: string) => values[key]),
    get: jest.fn((key: string, fallback?: unknown) => values[key] ?? fallback),
  } as unknown as ConfigService;
}

function createMessage(overrides?: Record<string, unknown>) {
  return {
    content: Buffer.from(
      JSON.stringify({
        eventId: 'evt-1',
        correlationId: 'corr-1',
        sourceId: 3,
        tenantId: 'tenant-acme',
        filename: 'guide.pdf',
        mimeType: 'application/pdf',
        storageKey: 'docs/guide.pdf',
        storageUrl: 'file:///docs/guide.pdf',
        fileContentBase64: Buffer.from('hello').toString('base64'),
        uploadedAt: new Date().toISOString(),
        ...overrides,
      }),
    ),
    properties: {
      headers: {},
      contentType: 'application/json',
      contentEncoding: 'utf-8',
      messageId: 'evt-1',
      correlationId: 'corr-1',
    },
  } as never;
}

describe('DocumentIngestionConsumerService', () => {
  it('acknowledges a successfully processed message', async () => {
    const ack = jest.fn();
    const workerService = {
      process: jest.fn().mockResolvedValue({ status: 'processed' }),
    } as unknown as DocumentIngestionWorkerService;
    const service = new DocumentIngestionConsumerService(
      createConfigService(),
      {
        log: jest.fn(),
        error: jest.fn(),
      } as unknown as AppLoggerService,
      {
        increment: jest.fn(),
      } as unknown as MetricsService,
      workerService,
      {} as DocumentIngestionInternalClient,
    );

    Object.assign(service, {
      channel: {
        ack,
      },
    });

    await service.handleMessage(createMessage());

    expect(workerService.process).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: 3,
        tenantId: 'tenant-acme',
      }),
      0,
    );
    expect(ack).toHaveBeenCalled();
  });

  it('republishes transient failures to the retry exchange and acknowledges the original message', async () => {
    const ack = jest.fn();
    const publish = jest.fn();
    const updateIngestionStatus = jest.fn().mockResolvedValue(undefined);

    const service = new DocumentIngestionConsumerService(
      createConfigService(),
      {
        log: jest.fn(),
        error: jest.fn(),
      } as unknown as AppLoggerService,
      {
        increment: jest.fn(),
      } as unknown as MetricsService,
      {
        process: jest.fn().mockRejectedValue(new Error('transient_failure')),
      } as unknown as DocumentIngestionWorkerService,
      {
        updateIngestionStatus,
      } as unknown as DocumentIngestionInternalClient,
    );

    Object.assign(service, {
      channel: {
        ack,
        nack: jest.fn(),
        publish,
        waitForConfirms: jest.fn().mockResolvedValue(undefined),
      },
    });

    await service.handleMessage(createMessage());

    expect(updateIngestionStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: 3,
        status: 'PENDING',
        retryCount: 1,
      }),
    );
    expect(publish).toHaveBeenCalledWith(
      'documents.ingestion.retry',
      'document.ingestion.requested.retry',
      expect.any(Buffer),
      expect.objectContaining({
        type: 'document.ingestion.requested.retry',
        headers: expect.objectContaining({
          'x-retry-count': 1,
        }),
      }),
    );
    expect(ack).toHaveBeenCalled();
  });

  it('routes exhausted failures to the DLQ and acknowledges the original message', async () => {
    const ack = jest.fn();
    const publish = jest.fn();
    const failIngestion = jest.fn().mockResolvedValue(undefined);

    const service = new DocumentIngestionConsumerService(
      createConfigService(),
      {
        log: jest.fn(),
        error: jest.fn(),
      } as unknown as AppLoggerService,
      {
        increment: jest.fn(),
      } as unknown as MetricsService,
      {
        process: jest.fn().mockRejectedValue(new Error('permanent_failure')),
      } as unknown as DocumentIngestionWorkerService,
      {
        failIngestion,
      } as unknown as DocumentIngestionInternalClient,
    );

    Object.assign(service, {
      channel: {
        ack,
        nack: jest.fn(),
        publish,
        waitForConfirms: jest.fn().mockResolvedValue(undefined),
      },
    });

    await service.handleMessage({
      ...createMessage(),
      properties: {
        ...createMessage().properties,
        headers: { 'x-retry-count': 2 },
      },
    });

    expect(failIngestion).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: 3,
        retryCount: 3,
      }),
    );
    expect(publish).toHaveBeenCalledWith(
      'documents.ingestion.dlx',
      'document.ingestion.requested.dead',
      expect.any(Buffer),
      expect.objectContaining({
        type: 'document.ingestion.failed',
        headers: expect.objectContaining({
          'x-retry-count': 3,
          'x-failure-reason': 'retry_exhausted',
        }),
      }),
    );
    expect(ack).toHaveBeenCalled();
  });

  it('sends source-not-found skips to the DLQ', async () => {
    const ack = jest.fn();
    const publish = jest.fn();
    const service = new DocumentIngestionConsumerService(
      createConfigService(),
      {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
      } as unknown as AppLoggerService,
      {
        increment: jest.fn(),
      } as unknown as MetricsService,
      {
        process: jest
          .fn()
          .mockResolvedValue({ status: 'skipped', reason: 'source_not_found' }),
      } as unknown as DocumentIngestionWorkerService,
      {} as DocumentIngestionInternalClient,
    );

    Object.assign(service, {
      channel: {
        ack,
        publish,
        waitForConfirms: jest.fn().mockResolvedValue(undefined),
      },
    });

    await service.handleMessage(createMessage());

    expect(publish).toHaveBeenCalledWith(
      'documents.ingestion.dlx',
      'document.ingestion.requested.dead',
      expect.any(Buffer),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-failure-reason': 'source_not_found',
        }),
      }),
    );
    expect(ack).toHaveBeenCalled();
  });
});
