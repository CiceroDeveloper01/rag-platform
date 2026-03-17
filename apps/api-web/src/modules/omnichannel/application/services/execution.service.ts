import { Inject, Injectable } from '@nestjs/common';
import type {
  ExecutionStreamEventResponse,
  ExecutionStreamEventType,
} from '@rag-platform/contracts';
import { MetricTimer } from '../../../../common/observability/decorators/metric-timer.decorator';
import { Trace } from '../../../../common/observability/decorators/trace.decorator';
import { OMNICHANNEL_EXECUTION_TRACKING_REPOSITORY } from '../interfaces/execution-tracking-repository.interface';
import type {
  CompleteTrackedExecutionInput,
  CreateTrackedExecutionInput,
  FailTrackedExecutionInput,
  IExecutionTrackingRepository,
  LogExecutionEventInput,
  TrackedExecutionEventRecord,
  TrackedExecutionRecord,
} from '../interfaces/execution-tracking-repository.interface';
import { ExecutionActivityStreamService } from './execution-activity-stream.service';

type ExecutionPresentation = {
  color: string;
  icon: string;
  severity: 'info' | 'success' | 'warning' | 'error';
};

@Injectable()
export class ExecutionService {
  private static readonly EVENT_PRESENTATION: Record<
    ExecutionStreamEventType,
    ExecutionPresentation
  > = {
    message_received: {
      color: 'green',
      icon: 'message-circle',
      severity: 'success',
    },
    message_normalized: {
      color: 'blue',
      icon: 'sparkles',
      severity: 'info',
    },
    feature_flag_checked: {
      color: 'blue',
      icon: 'toggle-left',
      severity: 'info',
    },
    feature_flag_blocked: {
      color: 'red',
      icon: 'toggle-right',
      severity: 'error',
    },
    feature_flag_fallback_applied: {
      color: 'yellow',
      icon: 'shuffle',
      severity: 'warning',
    },
    ai_policy_checked: {
      color: 'blue',
      icon: 'shield',
      severity: 'info',
    },
    ai_policy_passed: {
      color: 'green',
      icon: 'shield-check',
      severity: 'success',
    },
    ai_policy_rejected: {
      color: 'red',
      icon: 'shield-alert',
      severity: 'error',
    },
    execution_started: {
      color: 'blue',
      icon: 'play',
      severity: 'info',
    },
    rag_retrieval_started: {
      color: 'purple',
      icon: 'search',
      severity: 'info',
    },
    rag_retrieval_completed: {
      color: 'purple',
      icon: 'database',
      severity: 'success',
    },
    agent_execution_started: {
      color: 'yellow',
      icon: 'bot',
      severity: 'warning',
    },
    agent_execution_completed: {
      color: 'yellow',
      icon: 'check-circle',
      severity: 'success',
    },
    response_sent: {
      color: 'cyan',
      icon: 'send',
      severity: 'success',
    },
    error: {
      color: 'red',
      icon: 'alert-circle',
      severity: 'error',
    },
  };

  constructor(
    @Inject(OMNICHANNEL_EXECUTION_TRACKING_REPOSITORY)
    private readonly repository: IExecutionTrackingRepository,
    private readonly executionActivityStreamService: ExecutionActivityStreamService,
  ) {}

  @Trace('execution.tracking.create')
  @MetricTimer({
    metricName: 'execution_tracking_create_duration_ms',
    labels: { module: 'omnichannel' },
  })
  async createExecution(
    input: CreateTrackedExecutionInput,
  ): Promise<TrackedExecutionRecord> {
    const execution = await this.repository.createExecution(input);

    this.executionActivityStreamService.publish(
      this.buildStreamEvent({
        executionId: execution.id,
        type: 'execution_started',
        timestamp: execution.startedAt.toISOString(),
        metadata: {
          channel: execution.channel,
          sourceType: execution.sourceType,
          sourceId: execution.sourceId,
        },
      }),
    );

    return execution;
  }

  @Trace('execution.tracking.event')
  async logEvent(
    input: LogExecutionEventInput,
  ): Promise<TrackedExecutionEventRecord> {
    const event = await this.repository.logEvent(input);

    this.executionActivityStreamService.publish(
      this.buildStreamEvent({
        executionId: event.executionId,
        type: event.eventName,
        timestamp: event.occurredAt.toISOString(),
        metadata: event.metadata,
      }),
    );

    return event;
  }

  @Trace('execution.tracking.complete')
  completeExecution(input: CompleteTrackedExecutionInput): Promise<void> {
    return this.repository.completeExecution(input);
  }

  @Trace('execution.tracking.fail')
  failExecution(input: FailTrackedExecutionInput): Promise<void> {
    return this.repository.failExecution(input);
  }

  private buildStreamEvent(input: {
    executionId: number;
    type: ExecutionStreamEventType;
    timestamp: string;
    metadata?: Record<string, unknown> | null;
  }): ExecutionStreamEventResponse {
    const presentation = ExecutionService.EVENT_PRESENTATION[input.type];

    return {
      executionId: input.executionId,
      type: input.type,
      eventType: input.type,
      message: this.getEventMessage(input.type, input.metadata),
      color: presentation?.color ?? 'slate',
      icon: presentation?.icon ?? 'activity',
      severity: presentation?.severity ?? 'info',
      channel: this.getChannel(input.metadata),
      timestamp: input.timestamp,
      metadata: input.metadata ?? null,
    };
  }

  private getEventMessage(
    type: ExecutionStreamEventType,
    metadata?: Record<string, unknown> | null,
  ): string {
    switch (type) {
      case 'message_received':
        return `${this.formatChannelPrefix(metadata)}Message received`;
      case 'message_normalized':
        return 'Message normalized for orchestrator processing';
      case 'feature_flag_checked':
        return 'Feature flag checked';
      case 'feature_flag_blocked': {
        const feature = this.getStringMetadata(metadata, 'feature');
        return feature
          ? `Feature flag blocked ${feature}`
          : 'Feature flag blocked execution';
      }
      case 'feature_flag_fallback_applied': {
        const feature = this.getStringMetadata(metadata, 'feature');
        return feature
          ? `Feature flag fallback applied for ${feature}`
          : 'Feature flag fallback applied';
      }
      case 'ai_policy_checked':
        return 'AI usage policy checked';
      case 'ai_policy_passed':
        return 'AI usage policy passed';
      case 'ai_policy_rejected': {
        const reason = this.getStringMetadata(metadata, 'reason');
        return reason
          ? `AI usage policy rejected request (${reason})`
          : 'AI usage policy rejected request';
      }
      case 'execution_started':
        return 'Execution started';
      case 'rag_retrieval_started':
        return 'RAG retrieval started';
      case 'rag_retrieval_completed': {
        const count = this.getNumericMetadata(metadata, 'contextsCount');
        return count !== null
          ? `RAG retrieval completed (${String(count)} documents)`
          : 'RAG retrieval completed';
      }
      case 'agent_execution_started':
        return 'Agent execution started';
      case 'agent_execution_completed': {
        const modelName = this.getStringMetadata(metadata, 'modelName');
        return modelName
          ? `Agent execution completed (${modelName})`
          : 'Agent execution completed';
      }
      case 'response_sent': {
        const dispatchAccepted = metadata?.['dispatchAccepted'];
        return dispatchAccepted === false
          ? 'Response generated but dispatch skipped'
          : 'Response sent';
      }
      case 'error': {
        const errorMessage = this.getStringMetadata(metadata, 'message');
        return errorMessage ? `Error: ${errorMessage}` : 'Execution error';
      }
      default:
        return type
          .split('_')
          .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
          .join(' ');
    }
  }

  private formatChannelPrefix(
    metadata?: Record<string, unknown> | null,
  ): string {
    const channel = this.getChannel(metadata);
    return channel ? `${channel} ` : '';
  }

  private getChannel(
    metadata?: Record<string, unknown> | null,
  ): string | undefined {
    return this.getStringMetadata(metadata, 'channel') ?? undefined;
  }

  private getStringMetadata(
    metadata: Record<string, unknown> | null | undefined,
    key: string,
  ): string | null {
    const value = metadata?.[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private getNumericMetadata(
    metadata: Record<string, unknown> | null | undefined,
    key: string,
  ): number | null {
    const value = metadata?.[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }
}
