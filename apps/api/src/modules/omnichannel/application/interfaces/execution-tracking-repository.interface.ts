import { ExecutionEventName } from '../../domain/enums/execution-event-name.enum';
import { OmnichannelExecutionStatus } from '../../domain/enums/omnichannel-execution-status.enum';
import { MessageChannel } from '../../domain/enums/message-channel.enum';

export interface TrackedExecutionRecord {
  id: number;
  sourceType: string;
  sourceId: number;
  channel: MessageChannel;
  correlationId: string;
  traceId: string;
  status: OmnichannelExecutionStatus;
  errorMessage: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackedExecutionEventRecord {
  id: number;
  executionId: number;
  eventName: ExecutionEventName;
  metadata: Record<string, unknown> | null;
  occurredAt: Date;
  createdAt: Date;
}

export interface CreateTrackedExecutionInput {
  sourceType: string;
  sourceId: number;
  channel: MessageChannel;
  correlationId: string;
  traceId: string;
  status?: OmnichannelExecutionStatus;
  startedAt?: Date;
}

export interface LogExecutionEventInput {
  executionId: number;
  eventName: ExecutionEventName;
  metadata?: Record<string, unknown> | null;
  occurredAt?: Date;
}

export interface CompleteTrackedExecutionInput {
  executionId: number;
  finishedAt: Date;
  status?: OmnichannelExecutionStatus;
}

export interface FailTrackedExecutionInput {
  executionId: number;
  errorMessage: string;
  finishedAt: Date;
  status?: OmnichannelExecutionStatus;
}

export interface IExecutionTrackingRepository {
  createExecution(
    input: CreateTrackedExecutionInput,
  ): Promise<TrackedExecutionRecord>;
  logEvent(input: LogExecutionEventInput): Promise<TrackedExecutionEventRecord>;
  completeExecution(input: CompleteTrackedExecutionInput): Promise<void>;
  failExecution(input: FailTrackedExecutionInput): Promise<void>;
}

export const OMNICHANNEL_EXECUTION_TRACKING_REPOSITORY = Symbol(
  'OMNICHANNEL_EXECUTION_TRACKING_REPOSITORY',
);
