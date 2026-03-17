import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { OmnichannelMessage } from '../../domain/entities/omnichannel-message.entity';
import { RagQueryResult } from './rag-gateway.interface';

export interface AgentExecutionRequest {
  message: OmnichannelMessage;
  channel: MessageChannel;
  correlationId: string;
  traceId: string;
  agentName: string;
  maxPromptTokens?: number;
  maxCompletionTokens?: number;
  ragResult?: RagQueryResult | null;
}

export interface AgentExecutionResult {
  responseText: string;
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  usedRag: boolean;
  ragQuery?: string | null;
  metadata?: Record<string, unknown>;
}

export interface IAgentExecutor {
  execute(request: AgentExecutionRequest): Promise<AgentExecutionResult>;
}

export const OMNICHANNEL_AGENT_EXECUTOR = Symbol('OMNICHANNEL_AGENT_EXECUTOR');
