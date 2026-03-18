import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { TracingService } from '../observability/services/tracing.service';
import { DocumentIngestionPublisherService } from './document-ingestion.publisher';

describe('DocumentIngestionPublisherService', () => {
  const createPayload = () => ({
    eventId: 'evt-1',
    correlationId: 'corr-1',
    sourceId: 7,
    tenantId: 'tenant-acme',
    filename: 'manual.pdf',
    mimeType: 'application/pdf',
    storageKey: 'stored/manual.pdf',
    storageUrl: 'file:///stored/manual.pdf',
    fileContentBase64: Buffer.from('hello').toString('base64'),
    uploadedAt: new Date('2026-03-17T12:00:00.000Z').toISOString(),
  });

  function createService(overrides?: {
    channel?: {
      publish?: jest.Mock;
      waitForConfirms?: jest.Mock;
    };
    tracingRunInSpan?: jest.Mock;
    logger?: {
      setContext?: jest.Mock;
      info?: jest.Mock;
    };
  }) {
    const publish =
      overrides?.channel?.publish ??
      jest.fn().mockReturnValue(true);
    const waitForConfirms =
      overrides?.channel?.waitForConfirms ??
      jest.fn().mockResolvedValue(undefined);
    const tracingRunInSpan =
      overrides?.tracingRunInSpan ??
      jest.fn(async (_name, operation) => operation());
    const logger = {
      setContext: overrides?.logger?.setContext ?? jest.fn(),
      info: overrides?.logger?.info ?? jest.fn(),
    };

    const service = new DocumentIngestionPublisherService(
      {
        getOrThrow: jest.fn((key: string) => {
          const values: Record<string, string> = {
            'rabbitmq.exchange': 'documents.ingestion',
            'rabbitmq.routingKey': 'document.ingestion.requested',
            'rabbitmq.url': 'amqp://guest:guest@localhost:5672',
          };

          return values[key];
        }),
        get: jest.fn(
          (key: string, fallback?: unknown) =>
            ({
              'rabbitmq.exchange': 'documents.ingestion',
            })[key] ?? fallback,
        ),
      } as unknown as ConfigService,
      {
        runInSpan: tracingRunInSpan,
      } as unknown as TracingService,
      logger as unknown as PinoLogger,
    );

    Object.assign(service, {
      getChannel: jest.fn().mockResolvedValue({
        publish,
        waitForConfirms,
      }),
    });

    return { service, publish, waitForConfirms, tracingRunInSpan, logger };
  }

  it('publishes document ingestion requests with the expected contract metadata', async () => {
    const { service, publish, waitForConfirms, tracingRunInSpan, logger } =
      createService();

    await service.publish(createPayload());

    expect(tracingRunInSpan).toHaveBeenCalledWith(
      'documents.ingestion.publish',
      expect.any(Function),
      expect.objectContaining({
        attributes: expect.objectContaining({
          'messaging.system': 'rabbitmq',
          'messaging.destination': 'documents.ingestion',
        }),
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: 7,
        tenantId: 'tenant-acme',
        eventId: 'evt-1',
        correlationId: 'corr-1',
        exchange: 'documents.ingestion',
        routingKey: 'document.ingestion.requested',
      }),
      'Publishing document ingestion request',
    );
    expect(publish).toHaveBeenCalledWith(
      'documents.ingestion',
      'document.ingestion.requested',
      expect.any(Buffer),
      expect.objectContaining({
        persistent: true,
        contentType: 'application/json',
        contentEncoding: 'utf-8',
        type: 'document.ingestion.requested',
        messageId: 'evt-1',
        correlationId: 'corr-1',
        headers: expect.objectContaining({
          'x-event-id': 'evt-1',
          'x-correlation-id': 'corr-1',
          'x-retry-count': 0,
          'x-source-id': 7,
        }),
      }),
    );

    const publishedBuffer = publish.mock.calls[0][2] as Buffer;
    expect(JSON.parse(publishedBuffer.toString('utf-8'))).toEqual(
      expect.objectContaining(createPayload()),
    );
    expect(waitForConfirms).toHaveBeenCalledTimes(1);
  });

  it('propagates broker confirmation failures', async () => {
    const { service } = createService({
      channel: {
        waitForConfirms: jest
          .fn()
          .mockRejectedValue(new Error('broker_unavailable')),
      },
    });

    await expect(service.publish(createPayload())).rejects.toThrow(
      'broker_unavailable',
    );
  });
});
