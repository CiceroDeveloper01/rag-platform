import { OmnichannelExecution } from '../entities/omnichannel-execution.entity';
import { OmnichannelExecutionStatus } from '../enums/omnichannel-execution-status.enum';

export interface OmnichannelExecutionFilters {
  limit: number;
  offset: number;
  status?: OmnichannelExecutionStatus;
}

export interface IExecutionRepository {
  create(execution: OmnichannelExecution): Promise<OmnichannelExecution>;
  finishSuccess(execution: OmnichannelExecution): Promise<OmnichannelExecution>;
  finishFailure(execution: OmnichannelExecution): Promise<OmnichannelExecution>;
  findById(executionId: number): Promise<OmnichannelExecution | null>;
  findByMessageId(messageId: number): Promise<OmnichannelExecution | null>;
  findMany(
    filters: OmnichannelExecutionFilters,
  ): Promise<OmnichannelExecution[]>;
  getOverview(): Promise<{
    totalExecutions: number;
    successExecutions: number;
    failedExecutions: number;
    avgLatencyMs: number;
  }>;
}

export const OMNICHANNEL_EXECUTION_REPOSITORY = Symbol(
  'OMNICHANNEL_EXECUTION_REPOSITORY',
);
