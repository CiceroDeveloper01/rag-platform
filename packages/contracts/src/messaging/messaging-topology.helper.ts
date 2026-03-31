import {
  CreateMessagingEnvelopeInput,
  MessagingBindingDefinition,
  MessagingBindingWithCompanions,
  MessagingChannelLike,
  MessagingEnvelope,
  MessagingPublishProperties,
} from "./messaging-topology.types";

export function withRetryAndDeadLetter(
  binding: MessagingBindingDefinition,
): MessagingBindingWithCompanions {
  return {
    ...binding,
    retryExchange: `${binding.exchange}.retry`,
    retryQueue: `${binding.queue}.retry`,
    retryRoutingKey: `${binding.routingKey}.retry`,
    deadLetterExchange: `${binding.exchange}.dlx`,
    deadLetterQueue: `${binding.queue}.dlq`,
    deadLetterRoutingKey: `${binding.routingKey}.dead`,
  };
}

export function createMessagingEnvelope<
  TPayload,
  TMetadata extends Record<string, unknown> = Record<string, unknown>,
>(
  input: CreateMessagingEnvelopeInput<TPayload, TMetadata>,
): MessagingEnvelope<TPayload, TMetadata> {
  return {
    messageId: input.messageId,
    correlationId: input.correlationId,
    causationId: input.causationId ?? input.messageId,
    tenantId: input.tenantId ?? null,
    timestamp: input.timestamp ?? new Date().toISOString(),
    eventType: input.eventType,
    source: input.source,
    payload: input.payload,
    metadata: (input.metadata ?? {}) as TMetadata,
  };
}

export function isMessagingEnvelope<TPayload = unknown>(
  value: unknown,
): value is MessagingEnvelope<TPayload> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<MessagingEnvelope<TPayload>>;

  return (
    typeof candidate.messageId === "string" &&
    typeof candidate.correlationId === "string" &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.eventType === "string" &&
    typeof candidate.source === "string" &&
    "payload" in candidate &&
    "metadata" in candidate
  );
}

export function buildMessagingPublishProperties(
  envelope: MessagingEnvelope<unknown>,
  overrides?: Partial<MessagingPublishProperties>,
): MessagingPublishProperties {
  const { headers: overrideHeaders, ...restOverrides } = overrides ?? {};

  return {
    persistent: true,
    contentType: "application/json",
    contentEncoding: "utf-8",
    messageId: envelope.messageId,
    correlationId: envelope.correlationId,
    type: envelope.eventType,
    ...restOverrides,
    headers: {
      "x-message-id": envelope.messageId,
      "x-correlation-id": envelope.correlationId,
      "x-causation-id": envelope.causationId,
      "x-tenant-id": envelope.tenantId,
      "x-event-type": envelope.eventType,
      "x-event-source": envelope.source,
      ...overrideHeaders,
    },
  };
}

export async function assertMessagingBindingTopology(
  channel: MessagingChannelLike,
  binding: MessagingBindingWithCompanions,
  retryDelayMs: number,
): Promise<void> {
  await channel.assertExchange(binding.exchange, "direct", { durable: true });
  await channel.assertExchange(binding.retryExchange, "direct", {
    durable: true,
  });
  await channel.assertExchange(binding.deadLetterExchange, "direct", {
    durable: true,
  });

  await channel.assertQueue(binding.queue, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": binding.deadLetterExchange,
      "x-dead-letter-routing-key": binding.deadLetterRoutingKey,
    },
  });
  await channel.bindQueue(binding.queue, binding.exchange, binding.routingKey);

  await channel.assertQueue(binding.retryQueue, {
    durable: true,
    arguments: {
      "x-message-ttl": retryDelayMs,
      "x-dead-letter-exchange": binding.exchange,
      "x-dead-letter-routing-key": binding.routingKey,
    },
  });
  await channel.bindQueue(
    binding.retryQueue,
    binding.retryExchange,
    binding.retryRoutingKey,
  );

  await channel.assertQueue(binding.deadLetterQueue, { durable: true });
  await channel.bindQueue(
    binding.deadLetterQueue,
    binding.deadLetterExchange,
    binding.deadLetterRoutingKey,
  );
}
