import { Inject, Injectable } from '@nestjs/common';
import { MetricTimer } from '../../../../common/observability/decorators/metric-timer.decorator';
import { Trace } from '../../../../common/observability/decorators/trace.decorator';
import { LLM_SERVICE } from '../../../../infra/ai/llm/llm.interface';
import type { LlmServiceInterface } from '../../../../infra/ai/llm/llm.interface';
import { IAgentExecutor } from '../../application/interfaces/agent-executor.interface';
import type {
  AgentExecutionRequest,
  AgentExecutionResult,
} from '../../application/interfaces/agent-executor.interface';

@Injectable()
export class DefaultAgentExecutor implements IAgentExecutor {
  constructor(
    @Inject(LLM_SERVICE)
    private readonly llmService: LlmServiceInterface,
  ) {}

  @Trace('agent.executor.execute')
  @MetricTimer({
    metricName: 'agent_executor_duration_ms',
    labels: { module: 'agent' },
  })
  async execute(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
    const prompt = this.buildPrompt(request);

    try {
      const responseText = await this.llmService.generateCompletion(prompt, {
        maxOutputTokens: request.maxCompletionTokens,
      });

      return {
        responseText,
        modelName: 'gpt-4o-mini',
        inputTokens: Math.ceil(prompt.length / 4),
        outputTokens: Math.ceil(responseText.length / 4),
        usedRag: Boolean(
          request.ragResult && request.ragResult.contexts.length > 0,
        ),
        ragQuery: request.ragResult?.question ?? null,
        metadata: {
          agentName: request.agentName,
        },
      };
    } catch {
      const fallbackText = request.ragResult?.contexts.length
        ? `Encontrei contexto relevante para a solicitacao. Resumo inicial: ${request.ragResult.contexts
            .slice(0, 2)
            .map((context) => context.content)
            .join(' ')}`
        : `Recebi sua mensagem pelo canal ${request.channel} e o agente inicial esta pronto para responder.`;

      return {
        responseText: fallbackText,
        modelName: 'deterministic-fallback',
        inputTokens: Math.ceil(prompt.length / 4),
        outputTokens: Math.ceil(fallbackText.length / 4),
        usedRag: Boolean(
          request.ragResult && request.ragResult.contexts.length > 0,
        ),
        ragQuery: request.ragResult?.question ?? null,
        metadata: {
          fallback: true,
          agentName: request.agentName,
        },
      };
    }
  }

  private buildPrompt(request: AgentExecutionRequest): string {
    const contexts = request.ragResult?.contexts.length
      ? request.ragResult.contexts
          .map(
            (context, index) =>
              `Context ${String(index + 1)}:\n${context.content}`,
          )
          .join('\n\n')
      : 'No retrieved context.';

    return `Channel: ${request.channel}\nAgent: ${request.agentName}\n\nContext:\n${contexts}\n\nMessage:\n${request.message.body}\n\nInstructions:\nGenerate a concise, helpful reply in the same language as the inbound message.`;
  }
}
