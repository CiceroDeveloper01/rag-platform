import { ConfigService } from '@nestjs/config';
import { isMessagingEnvelope } from '@rag-platform/contracts';
import type { ConsumeMessage } from 'amqplib';
import { connect } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';
import { ObservabilityMetricsService } from '../observability/services/metrics.service';
import { TracingService } from '../observability/services/tracing.service';
import { DocumentIngestionPublisherService } from './document-ingestion.publisher';

jest.setTimeout(30_000);

function createTopology(prefix: string) {
  return {
    queue: `${prefix}.requested`,
    exchange: `${prefix}.exchange`,
    routingKey: `${prefix}.requested`,
    retryExchange: `${prefix}.retry.exchange`,
    retryQueue: `${prefix}.requested.retry`,
    retryRoutingKey: `${prefix}.requested.retry`,
    deadLetterExchange: `${prefix}.dlx`,
    deadLetterQueue: `${prefix}.requested.dlq`,
    deadLetterRoutingKey: `${prefix}.requested.dead`,
  };
}

function createConfigService(
  url: string,
  topology: ReturnType<typeof createTopology>,
) {
  const values: Record<string, unknown> = {
    'rabbitmq.url': url,
    'rabbitmq.exchange': topology.exchange,
    'rabbitmq.queue': topology.queue,
    'rabbitmq.routingKey': topology.routingKey,
    'rabbitmq.retryExchange': topology.retryExchange,
    'rabbitmq.retryQueue': topology.retryQueue,
    'rabbitmq.retryRoutingKey': topology.retryRoutingKey,
    'rabbitmq.deadLetterExchange': topology.deadLetterExchange,
    'rabbitmq.deadLetterQueue': topology.deadLetterQueue,
    'rabbitmq.deadLetterRoutingKey': topology.deadLetterRoutingKey,
    'rabbitmq.retryDelayMs': 100,
  };

  return {
    getOrThrow: jest.fn((key: string) => values[key]),
    get: jest.fn((key: string, fallback?: unknown) => values[key] ?? fallback),
  } as unknown as ConfigService;
}

async function waitForMessage(
  channel: Awaited<ReturnType<Awaited<ReturnType<typeof connect>>['createChannel']>>,
  queue: string,
  timeoutMs = 5_000,
): Promise<ConsumeMessage> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const message = await channel.get(queue, { noAck: true });

    if (message) {
      return message;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Timed out waiting for RabbitMQ message in queue ${queue}`);
}

describe('DocumentIngestionPublisherService RabbitMQ integration', () => {
  const rabbitMqUrl =
    process.env.RABBITMQ_TEST_URL ?? 'amqp://guest:guest@localhost:5672';

  it('publishes a real ingestion event to RabbitMQ with the expected topology and headers', async () => {
    const topology = createTopology(
      `documents.integration.publisher.${Date.now()}`,
    );
    const adminConnection = await connect(rabbitMqUrl);
    const adminChannel = await adminConnection.createChannel();
    const service = new DocumentIngestionPublisherService(
      createConfigService(rabbitMqUrl, topology),
      {
        runInSpan: jest.fn(async (_name, operation) => operation()),
      } as unknown as TracingService,
      {
        incrementCounter: jest.fn(),
      } as unknown as ObservabilityMetricsService,
      {
        setContext: jest.fn(),
        info: jest.fn(),
      } as unknown as PinoLogger,
    );

    try {
      await service.publish({
        eventId: 'evt-int-1',
        correlationId: 'corr-int-1',
        sourceId: 101,
        tenantId: 'tenant-int',
        filename: 'contract.pdf',
        mimeType: 'application/pdf',
        storageKey: 'documents/contract.pdf',
        storageUrl: 'file:///documents/contract.pdf',
        fileContentBase64: Buffer.from('integration-payload').toString('base64'),
        uploadedAt: new Date('2026-03-17T12:00:00.000Z').toISOString(),
      });

      await expect(adminChannel.checkQueue(topology.queue)).resolves.toEqual(
        expect.objectContaining({
          queue: topology.queue,
        }),
      );
      await expect(
        adminChannel.checkQueue(topology.retryQueue),
      ).resolves.toEqual(
        expect.objectContaining({
          queue: topology.retryQueue,
        }),
      );
      await expect(
        adminChannel.checkQueue(topology.deadLetterQueue),
      ).resolves.toEqual(
        expect.objectContaining({
          queue: topology.deadLetterQueue,
        }),
      );

      const message = await waitForMessage(adminChannel, topology.queue);

      expect(message.properties.type).toBe('document.ingestion.requested');
      expect(message.properties.messageId).toBe('evt-int-1');
      expect(message.properties.correlationId).toBe('corr-int-1');
      expect(message.properties.headers).toEqual(
        expect.objectContaining({
          'x-message-id': 'evt-int-1',
          'x-event-id': 'evt-int-1',
          'x-correlation-id': 'corr-int-1',
          'x-tenant-id': 'tenant-int',
          'x-event-type': 'document.ingestion.requested',
          'x-event-source': 'api-business.document-ingestion.publisher',
          'x-retry-count': 0,
          'x-source-id': 101,
        }),
      );
      const payload = JSON.parse(message.content.toString('utf-8'));
      expect(isMessagingEnvelope(payload)).toBe(true);
      expect(payload).toEqual(
        expect.objectContaining({
          messageId: 'evt-int-1',
          correlationId: 'corr-int-1',
          tenantId: 'tenant-int',
          eventType: 'document.ingestion.requested',
          payload: expect.objectContaining({
            sourceId: 101,
            tenantId: 'tenant-int',
            filename: 'contract.pdf',
          }),
        }),
      );
    } finally {
      await service.onModuleDestroy();
      await adminChannel.deleteQueue(topology.queue).catch(() => undefined);
      await adminChannel.deleteQueue(topology.retryQueue).catch(() => undefined);
      await adminChannel
        .deleteQueue(topology.deadLetterQueue)
        .catch(() => undefined);
      await adminChannel
        .deleteExchange(topology.exchange)
        .catch(() => undefined);
      await adminChannel
        .deleteExchange(topology.retryExchange)
        .catch(() => undefined);
      await adminChannel
        .deleteExchange(topology.deadLetterExchange)
        .catch(() => undefined);
      await adminChannel.close().catch(() => undefined);
      await adminConnection.close().catch(() => undefined);
    }
  });
});
