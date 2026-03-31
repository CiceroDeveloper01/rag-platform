import {
  assertMessagingBindingTopology,
  buildMessagingPublishProperties,
  createMessagingEnvelope,
} from '@rag-platform/contracts';

describe('messaging topology helpers', () => {
  it('creates a standard envelope and publish properties for rabbitmq messages', () => {
    const envelope = createMessagingEnvelope({
      messageId: 'msg-1',
      correlationId: 'corr-1',
      tenantId: 'tenant-acme',
      eventType: 'handoff.requested',
      source: 'orchestrator.test',
      payload: { handoffId: 'handoff-1' },
      metadata: { priority: 'high' },
    });

    expect(envelope).toEqual(
      expect.objectContaining({
        messageId: 'msg-1',
        correlationId: 'corr-1',
        causationId: 'msg-1',
        tenantId: 'tenant-acme',
        eventType: 'handoff.requested',
        source: 'orchestrator.test',
        payload: { handoffId: 'handoff-1' },
        metadata: { priority: 'high' },
      }),
    );

    expect(buildMessagingPublishProperties(envelope)).toEqual(
      expect.objectContaining({
        messageId: 'msg-1',
        correlationId: 'corr-1',
        type: 'handoff.requested',
        headers: expect.objectContaining({
          'x-message-id': 'msg-1',
          'x-correlation-id': 'corr-1',
          'x-tenant-id': 'tenant-acme',
          'x-event-type': 'handoff.requested',
          'x-event-source': 'orchestrator.test',
        }),
      }),
    );
  });

  it('asserts the exchange, queue, retry and dead-letter topology consistently', async () => {
    const channel = {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
    };

    await assertMessagingBindingTopology(
      channel,
      {
        exchange: 'memory',
        queue: 'memory.enrichment',
        routingKey: 'enrichment.requested',
        retryExchange: 'memory.retry',
        retryQueue: 'memory.enrichment.retry',
        retryRoutingKey: 'enrichment.requested.retry',
        deadLetterExchange: 'memory.dlx',
        deadLetterQueue: 'memory.enrichment.dlq',
        deadLetterRoutingKey: 'enrichment.requested.dead',
      },
      15_000,
    );

    expect(channel.assertExchange).toHaveBeenCalledTimes(3);
    expect(channel.assertQueue).toHaveBeenCalledTimes(3);
    expect(channel.bindQueue).toHaveBeenCalledTimes(3);
    expect(channel.assertQueue).toHaveBeenCalledWith(
      'memory.enrichment.retry',
      expect.objectContaining({
        arguments: expect.objectContaining({
          'x-message-ttl': 15_000,
          'x-dead-letter-exchange': 'memory',
          'x-dead-letter-routing-key': 'enrichment.requested',
        }),
      }),
    );
  });
});
