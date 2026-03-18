import { OmnichannelExecutionStatus } from '../enums/omnichannel-execution-status.enum';

export interface OmnichannelExecutionProps {
  id?: number;
  messageId: number;
  traceId: string;
  spanId: string;
  agentName: string;
  usedRag: boolean;
  ragQuery?: string | null;
  modelName?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  latencyMs?: number | null;
  status: OmnichannelExecutionStatus;
  errorMessage?: string | null;
  startedAt: Date;
  finishedAt?: Date | null;
  createdAt?: Date;
}

export class OmnichannelExecution {
  constructor(private readonly props: OmnichannelExecutionProps) {}

  static start(
    props: Omit<
      OmnichannelExecutionProps,
      | 'status'
      | 'startedAt'
      | 'createdAt'
      | 'usedRag'
      | 'ragQuery'
      | 'modelName'
      | 'inputTokens'
      | 'outputTokens'
      | 'latencyMs'
      | 'errorMessage'
      | 'finishedAt'
    > & { startedAt?: Date },
  ): OmnichannelExecution {
    const now = props.startedAt ?? new Date();

    return new OmnichannelExecution({
      ...props,
      usedRag: false,
      status: OmnichannelExecutionStatus.STARTED,
      startedAt: now,
      createdAt: now,
    });
  }

  succeed(payload: {
    usedRag: boolean;
    ragQuery?: string | null;
    modelName?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    latencyMs: number;
    finishedAt: Date;
  }): OmnichannelExecution {
    return new OmnichannelExecution({
      ...this.props,
      usedRag: payload.usedRag,
      ragQuery: payload.ragQuery,
      modelName: payload.modelName,
      inputTokens: payload.inputTokens,
      outputTokens: payload.outputTokens,
      latencyMs: payload.latencyMs,
      status: OmnichannelExecutionStatus.SUCCESS,
      finishedAt: payload.finishedAt,
      errorMessage: null,
    });
  }

  fail(payload: {
    errorMessage: string;
    latencyMs: number;
    finishedAt: Date;
    status?: OmnichannelExecutionStatus;
  }): OmnichannelExecution {
    return new OmnichannelExecution({
      ...this.props,
      latencyMs: payload.latencyMs,
      status: payload.status ?? OmnichannelExecutionStatus.FAILED,
      finishedAt: payload.finishedAt,
      errorMessage: payload.errorMessage,
    });
  }

  toObject(): OmnichannelExecutionProps {
    return { ...this.props };
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get messageId(): number {
    return this.props.messageId;
  }
}
