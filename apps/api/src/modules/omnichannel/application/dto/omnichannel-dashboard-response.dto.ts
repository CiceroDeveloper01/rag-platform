import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  ChannelMetricsResponse,
  ConnectorListItemResponse,
  ExecutionTimelineEventResponse,
  LatencyMetricsResponse,
  OmnichannelExecutionDetailsResponse,
  OmnichannelExecutionListItemResponse,
  OmnichannelOverviewChannelResponse,
  OmnichannelOverviewResponse,
  OmnichannelRequestDetailsResponse,
  OmnichannelRequestListItemResponse,
  PaginatedResponse,
  RagUsageByChannelResponse,
  RagUsageMetricsResponse,
} from '@rag-platform/contracts';
import type { DateTimeValue, PaginationMeta } from '@rag-platform/types';
import { ConnectorHealthStatus } from '../../domain/enums/connector-health-status.enum';
import { ExecutionEventName } from '../../domain/enums/execution-event-name.enum';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { MessageDirection } from '../../domain/enums/message-direction.enum';
import { OmnichannelExecutionStatus } from '../../domain/enums/omnichannel-execution-status.enum';
import { OmnichannelMessageStatus } from '../../domain/enums/omnichannel-message-status.enum';

export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;

  @ApiProperty({ example: 135 })
  total!: number;
}

export class ChannelOverviewItemDto implements OmnichannelOverviewChannelResponse {
  @ApiProperty({ enum: MessageChannel, example: MessageChannel.TELEGRAM })
  channel!: MessageChannel;

  @ApiProperty({ example: 120 })
  totalRequests!: number;

  @ApiProperty({ example: 110 })
  success!: number;

  @ApiProperty({ example: 10 })
  errors!: number;
}

export class OmnichannelOverviewResponseDto implements OmnichannelOverviewResponse {
  @ApiProperty({ example: 2200 })
  totalRequests!: number;

  @ApiProperty({ example: 2140 })
  successCount!: number;

  @ApiProperty({ example: 60 })
  errorCount!: number;

  @ApiProperty({ example: 184.3 })
  avgLatencyMs!: number;

  @ApiProperty({ example: 520.7 })
  p95LatencyMs!: number;

  @ApiProperty({ example: 36.4 })
  ragUsagePercentage!: number;

  @ApiProperty({ example: 2 })
  activeConnectors!: number;

  @ApiProperty({ example: 480 })
  requestsLast24h!: number;

  @ApiProperty({ example: 1860 })
  requestsLast7d!: number;

  @ApiProperty({ type: () => [ChannelOverviewItemDto] })
  channels!: ChannelOverviewItemDto[];
}

export class OmnichannelRequestListItemDto implements OmnichannelRequestListItemResponse {
  @ApiProperty({ example: 101 })
  id!: number;

  @ApiProperty({ enum: MessageChannel, example: MessageChannel.TELEGRAM })
  channel!: MessageChannel;

  @ApiPropertyOptional({ example: 'chat-123' })
  conversationId!: string | null;

  @ApiPropertyOptional({ example: 'John Doe' })
  senderName!: string | null;

  @ApiPropertyOptional({ example: 'john@example.com' })
  senderAddress!: string | null;

  @ApiProperty({
    example: 'How can I configure omnichannel connector health checks?',
  })
  normalizedTextPreview!: string;

  @ApiProperty({
    enum: OmnichannelMessageStatus,
    example: OmnichannelMessageStatus.PROCESSED,
  })
  status!: OmnichannelMessageStatus;

  @ApiProperty({ example: '2026-03-13T11:12:13.000Z' })
  receivedAt!: DateTimeValue;

  @ApiPropertyOptional({ example: '2026-03-13T11:12:14.000Z' })
  processedAt!: DateTimeValue | null;

  @ApiPropertyOptional({ example: 143 })
  latencyMs!: number | null;

  @ApiProperty({ example: true })
  usedRag!: boolean;
}

export class PaginatedOmnichannelRequestListDto implements PaginatedResponse<OmnichannelRequestListItemResponse> {
  @ApiProperty({ type: () => [OmnichannelRequestListItemDto] })
  items!: OmnichannelRequestListItemDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  pagination!: PaginationMetaDto;
}

export class OmnichannelExecutionDetailsDto implements OmnichannelExecutionDetailsResponse {
  @ApiPropertyOptional({ example: 3001 })
  executionId!: number | null;

  @ApiPropertyOptional({ example: 'rag-agent' })
  agentName!: string | null;

  @ApiProperty({ example: true })
  usedRag!: boolean;

  @ApiPropertyOptional({ example: 'connector health for telegram' })
  ragQuery!: string | null;

  @ApiPropertyOptional({ example: 'gpt-4o-mini' })
  modelName!: string | null;

  @ApiPropertyOptional({ example: 1120 })
  inputTokens!: number | null;

  @ApiPropertyOptional({ example: 186 })
  outputTokens!: number | null;

  @ApiPropertyOptional({ example: 287 })
  latencyMs!: number | null;

  @ApiPropertyOptional({
    enum: OmnichannelExecutionStatus,
    example: OmnichannelExecutionStatus.SUCCESS,
  })
  status!: OmnichannelExecutionStatus | null;

  @ApiPropertyOptional({ example: null })
  errorMessage!: string | null;

  @ApiPropertyOptional({ example: '2026-03-13T11:12:13.000Z' })
  startedAt!: DateTimeValue | null;

  @ApiPropertyOptional({ example: '2026-03-13T11:12:14.000Z' })
  finishedAt!: DateTimeValue | null;

  @ApiProperty({ type: () => [ExecutionTimelineEventDto] })
  timeline!: ExecutionTimelineEventDto[];
}

export class ExecutionTimelineEventDto implements ExecutionTimelineEventResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({
    enum: ExecutionEventName,
    example: ExecutionEventName.AGENT_EXECUTION_COMPLETED,
  })
  eventName!: ExecutionTimelineEventResponse['eventName'];

  @ApiProperty({ example: '2026-03-13T11:12:13.500Z' })
  occurredAt!: DateTimeValue;

  @ApiPropertyOptional({
    example: { modelName: 'gpt-4o-mini', usedRag: true },
  })
  metadata!: Record<string, unknown> | null;
}

class OmnichannelRequestMessageDetailsDto {
  @ApiProperty({ example: 101 })
  id!: number;

  @ApiProperty({ enum: MessageChannel, example: MessageChannel.TELEGRAM })
  channel!: MessageChannel;

  @ApiProperty({ enum: MessageDirection, example: MessageDirection.INBOUND })
  direction!: MessageDirection;

  @ApiPropertyOptional({ example: 'chat-123' })
  conversationId!: string | null;

  @ApiPropertyOptional({ example: 'John Doe' })
  senderName!: string | null;

  @ApiPropertyOptional({ example: 'john@example.com' })
  senderAddress!: string | null;

  @ApiPropertyOptional({ example: 'bot@rag-platform.local' })
  recipientAddress!: string | null;

  @ApiPropertyOptional({ example: 'Connector health question' })
  subject!: string | null;

  @ApiProperty({
    example: 'How can I configure omnichannel connector health checks?',
  })
  body!: string;

  @ApiProperty({
    example: 'how can i configure omnichannel connector health checks',
  })
  normalizedText!: string;

  @ApiPropertyOptional({
    example: { provider: 'telegram', chatId: 123456789 },
  })
  metadata!: Record<string, unknown> | null;

  @ApiProperty({
    enum: OmnichannelMessageStatus,
    example: OmnichannelMessageStatus.PROCESSED,
  })
  status!: OmnichannelMessageStatus;

  @ApiProperty({ example: '2026-03-13T11:12:13.000Z' })
  receivedAt!: DateTimeValue;

  @ApiPropertyOptional({ example: '2026-03-13T11:12:14.000Z' })
  processedAt!: DateTimeValue | null;
}

export class OmnichannelRequestDetailsDto implements OmnichannelRequestDetailsResponse {
  @ApiProperty({ type: () => OmnichannelRequestMessageDetailsDto })
  message!: OmnichannelRequestMessageDetailsDto;

  @ApiPropertyOptional({ type: () => OmnichannelExecutionDetailsDto })
  execution!: OmnichannelExecutionDetailsDto | null;
}

export class OmnichannelExecutionListItemDto implements OmnichannelExecutionListItemResponse {
  @ApiProperty({ example: 3001 })
  executionId!: number;

  @ApiProperty({ example: 101 })
  messageId!: number;

  @ApiProperty({ enum: MessageChannel, example: MessageChannel.TELEGRAM })
  channel!: MessageChannel;

  @ApiPropertyOptional({ example: 'rag-agent' })
  agentName!: string;

  @ApiProperty({ example: true })
  usedRag!: boolean;

  @ApiPropertyOptional({ example: 'gpt-4o-mini' })
  modelName!: string | null;

  @ApiPropertyOptional({ example: 287 })
  latencyMs!: number | null;

  @ApiProperty({
    enum: OmnichannelExecutionStatus,
    example: OmnichannelExecutionStatus.SUCCESS,
  })
  status!: OmnichannelExecutionStatus;

  @ApiProperty({ example: '2026-03-13T11:12:13.000Z' })
  startedAt!: DateTimeValue;

  @ApiPropertyOptional({ example: '2026-03-13T11:12:14.000Z' })
  finishedAt!: DateTimeValue | null;
}

export class PaginatedOmnichannelExecutionListDto implements PaginatedResponse<OmnichannelExecutionListItemResponse> {
  @ApiProperty({ type: () => [OmnichannelExecutionListItemDto] })
  items!: OmnichannelExecutionListItemDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  pagination!: PaginationMetaDto;
}

export class ChannelMetricsDto implements ChannelMetricsResponse {
  @ApiProperty({ enum: MessageChannel, example: MessageChannel.TELEGRAM })
  channel!: MessageChannel;

  @ApiProperty({ example: 120 })
  totalRequests!: number;

  @ApiProperty({ example: 110 })
  successCount!: number;

  @ApiProperty({ example: 10 })
  errorCount!: number;
}

export class LatencyMetricsDto implements LatencyMetricsResponse {
  @ApiProperty({ enum: MessageChannel, example: MessageChannel.TELEGRAM })
  channel!: MessageChannel;

  @ApiProperty({ example: 184.3 })
  avgLatencyMs!: number;

  @ApiProperty({ example: 520.7 })
  p95LatencyMs!: number;
}

export class RagUsageByChannelDto implements RagUsageByChannelResponse {
  @ApiProperty({ enum: MessageChannel, example: MessageChannel.TELEGRAM })
  channel!: MessageChannel;

  @ApiProperty({ example: 200 })
  totalExecutions!: number;

  @ApiProperty({ example: 90 })
  ragExecutions!: number;

  @ApiProperty({ example: 45 })
  ragUsagePercentage!: number;
}

export class RagUsageMetricsDto implements RagUsageMetricsResponse {
  @ApiProperty({ example: 450 })
  totalExecutions!: number;

  @ApiProperty({ example: 160 })
  ragExecutions!: number;

  @ApiProperty({ example: 35.56 })
  ragUsagePercentage!: number;

  @ApiProperty({ type: () => [RagUsageByChannelDto] })
  channels!: RagUsageByChannelDto[];
}

export class ConnectorDto implements ConnectorListItemResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ enum: MessageChannel, example: MessageChannel.TELEGRAM })
  channel!: MessageChannel;

  @ApiProperty({ example: 'Telegram Bot Connector' })
  name!: string;

  @ApiProperty({ example: true })
  isEnabled!: boolean;

  @ApiProperty({
    enum: ConnectorHealthStatus,
    example: ConnectorHealthStatus.HEALTHY,
  })
  healthStatus!: ConnectorHealthStatus;

  @ApiPropertyOptional({ example: '2026-03-13T11:00:00.000Z' })
  lastHealthCheckAt!: DateTimeValue | null;
}
