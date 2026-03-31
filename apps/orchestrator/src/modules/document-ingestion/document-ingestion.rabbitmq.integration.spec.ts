import { ConfigService } from '@nestjs/config';
import type { ConsumeMessage, Channel } from 'amqplib';
import { connect } from 'amqplib';
import { AppLoggerService, MetricsService, TracingService } from '@rag-platform/observability';
import { DocumentIngestionConsumerService } from './document-ingestion.consumer';
import { DocumentIngestionWorkerService } from './document-ingestion.worker';

jest.setTimeout(30_000);

const describeRabbitMqIntegration =
  process.env.RUN_RABBITMQ_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

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
  overrides?: Partial<Record<string, unknown>>,
) {
  const values: Record<string, unknown> = {
    'rabbitmq.url': url,
    'rabbitmq.queue': topology.queue,
    'rabbitmq.exchange': topology.exchange,
    'rabbitmq.routingKey': topology.routingKey,
    'rabbitmq.retryExchange': topology.retryExchange,
    'rabbitmq.retryQueue': topology.retryQueue,
    'rabbitmq.retryRoutingKey': topology.retryRoutingKey,
    'rabbitmq.deadLetterExchange': topology.deadLetterExchange,
    'rabbitmq.deadLetterQueue': topology.deadLetterQueue,
    'rabbitmq.deadLetterRoutingKey': topology.deadLetterRoutingKey,
    'rabbitmq.retryDelayMs': 100,
    'rabbitmq.maxAttempts': 2,
    'rabbitmq.prefetchCount': 1,
    ...overrides,
  };

  return {
    getOrThrow: jest.fn((key: string) => values[key]),
    get: jest.fn((key: string, fallback?: unknown) => values[key] ?? fallback),
  } as unknown as ConfigService;
}

function createEvent(eventId = 'evt-int-1') {
  return {
    eventId,
    correlationId: `corr-${eventId}`,
    sourceId: 33,
    tenantId: 'tenant-int',
    filename: 'handbook.pdf',
    mimeType: 'application/pdf',
    storageKey: 'documents/handbook.pdf',
    storageUrl: 'file:///documents/handbook.pdf',
    fileContentBase64: Buffer.from('document body').toString('base64'),
    uploadedAt: new Date('2026-03-17T12:00:00.000Z').toISOString(),
  };
}

async function waitFor(
  assertion: () => Promise<void> | void,
  timeoutMs = 8_000,
): Promise<void> {
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Timed out waiting for RabbitMQ integration assertion');
}

async function waitForQueueMessage(
  channel: Channel,
  queue: string,
  timeoutMs = 8_000,
): Promise<ConsumeMessage> {
  let foundMessage: ConsumeMessage | false = false;

  await waitFor(async () => {
    foundMessage = await channel.get(queue, { noAck: true });
    expect(foundMessage).toBeTruthy();
  }, timeoutMs);

  return foundMessage as ConsumeMessage;
}

async function publishEvent(
  url: string,
  topology: ReturnType<typeof createTopology>,
  payload: Record<string, unknown>,
  retryCount = 0,
) {
  const connection = await connect(url);
  const channel = await connection.createConfirmChannel();

  try {
    await channel.assertExchange(topology.exchange, 'direct', { durable: true });
    channel.publish(
      topology.exchange,
      topology.routingKey,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
        contentType: 'application/json',
        contentEncoding: 'utf-8',
        messageId: String(payload.eventId),
        correlationId: String(payload.correlationId),
        headers: {
          'x-event-id': payload.eventId,
          'x-correlation-id': payload.correlationId,
          'x-retry-count': retryCount,
          'x-source-id': payload.sourceId,
        },
      },
    );
    await channel.waitForConfirms();
  } finally {
    await channel.close().catch(() => undefined);
    await connection.close().catch(() => undefined);
  }
}

async function cleanupTopology(
  channel: Channel,
  topology: ReturnType<typeof createTopology>,
) {
  await channel.deleteQueue(topology.queue).catch(() => undefined);
  await channel.deleteQueue(topology.retryQueue).catch(() => undefined);
  await channel.deleteQueue(topology.deadLetterQueue).catch(() => undefined);
  await channel.deleteExchange(topology.exchange).catch(() => undefined);
  await channel.deleteExchange(topology.retryExchange).catch(() => undefined);
  await channel.deleteExchange(topology.deadLetterExchange).catch(() => undefined);
}

describeRabbitMqIntegration('Document ingestion RabbitMQ integration', () => {
  const rabbitMqUrl =
    process.env.RABBITMQ_TEST_URL ?? 'amqp://guest:guest@localhost:5672';

  it('consumes a real broker message successfully and completes persisted ingestion', async () => {
    const topology = createTopology(`documents.integration.success.${Date.now()}`);
    const adminConnection = await connect(rabbitMqUrl);
    const adminChannel = await adminConnection.createChannel();
    const completeIngestion = jest.fn().mockResolvedValue(undefined);
    const updateIngestionStatus = jest.fn().mockResolvedValue(undefined);

    const workerService = new DocumentIngestionWorkerService(
      {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as unknown as AppLoggerService,
      {
        increment: jest.fn(),
        record: jest.fn(),
      } as unknown as MetricsService,
      {
        startSpan: jest.fn().mockReturnValue({}),
        endSpan: jest.fn(),
      } as unknown as TracingService,
      {
        parse: jest.fn().mockResolvedValue('document body'),
      } as never,
      {
        splitText: jest.fn().mockReturnValue(['document body']),
      } as never,
      {
        generateEmbeddings: jest.fn().mockResolvedValue([[0.12, 0.44]]),
      } as never,
      {
        startIngestion: jest.fn().mockResolvedValue({
          shouldProcess: true,
        }),
        updateIngestionStatus,
        completeIngestion,
      } as never,
    );

    const consumer = new DocumentIngestionConsumerService(
      createConfigService(rabbitMqUrl, topology),
      {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as unknown as AppLoggerService,
      {
        increment: jest.fn(),
      } as unknown as MetricsService,
      workerService,
      {} as never,
    );

    try {
      await consumer.onModuleInit();
      await publishEvent(rabbitMqUrl, topology, createEvent('evt-success'));

      await waitFor(() => {
        expect(updateIngestionStatus).toHaveBeenCalledWith(
          expect.objectContaining({
            sourceId: 33,
            status: 'PROCESSING',
            currentStep: 'PARSING',
          }),
        );
        expect(completeIngestion).toHaveBeenCalledWith(
          expect.objectContaining({
            sourceId: 33,
            tenantId: 'tenant-int',
            chunks: expect.arrayContaining([
              expect.objectContaining({
                content: 'document body',
              }),
            ]),
          }),
        );
      });

      expect(await adminChannel.get(topology.queue, { noAck: true })).toBe(false);
    } finally {
      await consumer.onModuleDestroy();
      await cleanupTopology(adminChannel, topology);
      await adminChannel.close().catch(() => undefined);
      await adminConnection.close().catch(() => undefined);
    }
  });

  it('retries transient failures and routes the message to the DLQ after retry exhaustion', async () => {
    const topology = createTopology(`documents.integration.retry.${Date.now()}`);
    const adminConnection = await connect(rabbitMqUrl);
    const adminChannel = await adminConnection.createChannel();
    const updateIngestionStatus = jest.fn().mockResolvedValue(undefined);
    const failIngestion = jest.fn().mockResolvedValue(undefined);
    const workerService = {
      process: jest.fn().mockRejectedValue(new Error('transient_failure')),
    } as unknown as DocumentIngestionWorkerService;
    const consumer = new DocumentIngestionConsumerService(
      createConfigService(rabbitMqUrl, topology, {
        'rabbitmq.retryDelayMs': 50,
        'rabbitmq.maxAttempts': 2,
      }),
      {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as unknown as AppLoggerService,
      {
        increment: jest.fn(),
      } as unknown as MetricsService,
      workerService,
      {
        updateIngestionStatus,
        failIngestion,
      } as never,
    );

    try {
      await consumer.onModuleInit();
      await publishEvent(rabbitMqUrl, topology, createEvent('evt-retry'));

      await waitFor(() => {
        expect(updateIngestionStatus).toHaveBeenCalledWith(
          expect.objectContaining({
            sourceId: 33,
            status: 'PENDING',
            retryCount: 1,
          }),
        );
        expect(failIngestion).toHaveBeenCalledWith(
          expect.objectContaining({
            sourceId: 33,
            retryCount: 2,
          }),
        );
      });

      const dlqMessage = await waitForQueueMessage(
        adminChannel,
        topology.deadLetterQueue,
      );

      expect(dlqMessage.properties.headers).toEqual(
        expect.objectContaining({
          'x-failure-reason': 'retry_exhausted',
          'x-retry-count': 2,
          'x-source-id': 33,
        }),
      );
    } finally {
      await consumer.onModuleDestroy();
      await cleanupTopology(adminChannel, topology);
      await adminChannel.close().catch(() => undefined);
      await adminConnection.close().catch(() => undefined);
    }
  });

  it('does not execute heavy processing twice for a duplicate completed event', async () => {
    const topology = createTopology(`documents.integration.idempotent.${Date.now()}`);
    const adminConnection = await connect(rabbitMqUrl);
    const adminChannel = await adminConnection.createChannel();
    const parserService = {
      parse: jest.fn().mockResolvedValue('document body'),
    };
    const completeIngestion = jest.fn().mockResolvedValue(undefined);
    const startIngestion = jest
      .fn()
      .mockResolvedValueOnce({
        shouldProcess: true,
      })
      .mockResolvedValueOnce({
        shouldProcess: false,
        reason: 'already_completed',
      });
    const workerService = new DocumentIngestionWorkerService(
      {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as unknown as AppLoggerService,
      {
        increment: jest.fn(),
        record: jest.fn(),
      } as unknown as MetricsService,
      {
        startSpan: jest.fn().mockReturnValue({}),
        endSpan: jest.fn(),
      } as unknown as TracingService,
      parserService as never,
      {
        splitText: jest.fn().mockReturnValue(['document body']),
      } as never,
      {
        generateEmbeddings: jest.fn().mockResolvedValue([[0.42]]),
      } as never,
      {
        startIngestion,
        updateIngestionStatus: jest.fn().mockResolvedValue(undefined),
        completeIngestion,
      } as never,
    );
    const consumer = new DocumentIngestionConsumerService(
      createConfigService(rabbitMqUrl, topology),
      {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      } as unknown as AppLoggerService,
      {
        increment: jest.fn(),
      } as unknown as MetricsService,
      workerService,
      {} as never,
    );
    const duplicatePayload = createEvent('evt-duplicate');

    try {
      await consumer.onModuleInit();
      await publishEvent(rabbitMqUrl, topology, duplicatePayload);

      await waitFor(() => {
        expect(completeIngestion).toHaveBeenCalledTimes(1);
      });

      await publishEvent(rabbitMqUrl, topology, duplicatePayload);

      await waitFor(() => {
        expect(startIngestion).toHaveBeenCalledTimes(2);
      });

      expect(parserService.parse).toHaveBeenCalledTimes(1);
      expect(completeIngestion).toHaveBeenCalledTimes(1);
      expect(await adminChannel.get(topology.deadLetterQueue, { noAck: true })).toBe(
        false,
      );
    } finally {
      await consumer.onModuleDestroy();
      await cleanupTopology(adminChannel, topology);
      await adminChannel.close().catch(() => undefined);
      await adminConnection.close().catch(() => undefined);
    }
  });
});
