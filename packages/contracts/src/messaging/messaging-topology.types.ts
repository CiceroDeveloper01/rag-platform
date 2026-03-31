export interface MessagingBindingDefinition {
  exchange: string;
  queue: string;
  routingKey: string;
  description?: string;
}

export interface MessagingBindingWithCompanions
  extends MessagingBindingDefinition {
  retryExchange: string;
  retryQueue: string;
  retryRoutingKey: string;
  deadLetterExchange: string;
  deadLetterQueue: string;
  deadLetterRoutingKey: string;
}

export interface MessagingNamingConvention {
  exchangePattern: string;
  routingKeyPattern: string;
  queuePattern: string;
  notes: readonly string[];
}

export interface MessagingEnvelope<
  TPayload = unknown,
  TMetadata extends Record<string, unknown> = Record<string, unknown>,
> {
  messageId: string;
  correlationId: string;
  causationId: string | null;
  tenantId: string | null;
  timestamp: string;
  eventType: string;
  source: string;
  payload: TPayload;
  metadata: TMetadata;
}

export interface CreateMessagingEnvelopeInput<
  TPayload,
  TMetadata extends Record<string, unknown> = Record<string, unknown>,
> {
  messageId: string;
  correlationId: string;
  causationId?: string | null;
  tenantId?: string | null;
  timestamp?: string;
  eventType: string;
  source: string;
  payload: TPayload;
  metadata?: TMetadata;
}

export interface MessagingPublishProperties {
  persistent?: boolean;
  contentType?: string;
  contentEncoding?: string;
  messageId?: string;
  correlationId?: string;
  type?: string;
  headers?: Record<string, unknown>;
}

export interface MessagingChannelLike {
  assertExchange(
    exchange: string,
    type: string,
    options?: Record<string, unknown>,
  ): Promise<unknown>;
  assertQueue(
    queue: string,
    options?: Record<string, unknown>,
  ): Promise<unknown>;
  bindQueue(
    queue: string,
    exchange: string,
    routingKey: string,
  ): Promise<unknown>;
}
