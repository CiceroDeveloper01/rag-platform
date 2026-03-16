import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppCacheService } from '../../../../common/cache/services/app-cache.service';
import { MetricsService } from '../../../../infra/observability/metrics.service';
import type { RagQueryResult } from '../interfaces/rag-gateway.interface';
import { MessageChannel } from '../../domain/enums/message-channel.enum';
import { OmnichannelMessage } from '../../domain/entities/omnichannel-message.entity';

export interface AiUsagePolicyResult {
  allow: boolean;
  reason?: 'MESSAGE_TOO_LONG' | 'TOKEN_LIMIT_EXCEEDED' | 'RATE_LIMIT_EXCEEDED';
  estimatedPromptTokens: number;
  maxPromptTokens: number;
  maxCompletionTokens: number;
  rateLimitKey: string;
}

@Injectable()
export class AiUsagePolicyService {
  private static readonly RATE_LIMIT_WINDOW_SECONDS = 60;

  constructor(
    private readonly configService: ConfigService,
    private readonly appCacheService: AppCacheService,
    private readonly metricsService: MetricsService,
  ) {}

  async evaluate(
    message: OmnichannelMessage,
    ragResult?: RagQueryResult | null,
  ): Promise<AiUsagePolicyResult> {
    const messageData = message.toObject();
    const maxPromptTokens = this.configService.get<number>(
      'ai.maxPromptTokens',
      4_000,
    );
    const maxCompletionTokens = this.configService.get<number>(
      'ai.maxCompletionTokens',
      1_000,
    );
    const maxMessageCharacters = this.configService.get<number>(
      'ai.maxMessageCharacters',
      2_000,
    );
    const maxRequestsPerMinute = this.configService.get<number>(
      'ai.maxRequestsPerMinute',
      30,
    );

    this.metricsService.incrementCustomCounter('ai_requests_total', {
      channel: message.channel,
    });

    if (message.body.length > maxMessageCharacters) {
      this.recordRejected(message.channel, 'MESSAGE_TOO_LONG');
      return {
        allow: false,
        reason: 'MESSAGE_TOO_LONG',
        estimatedPromptTokens: this.estimateTokens(message.body),
        maxPromptTokens,
        maxCompletionTokens,
        rateLimitKey: this.buildRateLimitKey(message.channel, messageData),
      };
    }

    const estimatedPromptTokens = this.estimateTokens(
      this.buildPromptEstimateSource(message, ragResult),
    );

    if (estimatedPromptTokens > maxPromptTokens) {
      this.recordRejected(message.channel, 'TOKEN_LIMIT_EXCEEDED');
      return {
        allow: false,
        reason: 'TOKEN_LIMIT_EXCEEDED',
        estimatedPromptTokens,
        maxPromptTokens,
        maxCompletionTokens,
        rateLimitKey: this.buildRateLimitKey(message.channel, messageData),
      };
    }

    const rateLimitKey = this.buildRateLimitKey(message.channel, messageData);
    const requestCount =
      ((await this.appCacheService.get<number>(rateLimitKey)) ?? 0) + 1;
    await this.appCacheService.set(
      rateLimitKey,
      requestCount,
      AiUsagePolicyService.RATE_LIMIT_WINDOW_SECONDS,
    );

    if (requestCount > maxRequestsPerMinute) {
      this.recordRejected(message.channel, 'RATE_LIMIT_EXCEEDED');
      return {
        allow: false,
        reason: 'RATE_LIMIT_EXCEEDED',
        estimatedPromptTokens,
        maxPromptTokens,
        maxCompletionTokens,
        rateLimitKey,
      };
    }

    return {
      allow: true,
      estimatedPromptTokens,
      maxPromptTokens,
      maxCompletionTokens,
      rateLimitKey,
    };
  }

  recordExecution(
    message: OmnichannelMessage,
    inputTokens: number,
    outputTokens: number,
  ): void {
    this.metricsService.incrementCustomCounter(
      'ai_tokens_used_total',
      { channel: message.channel },
      inputTokens + outputTokens,
    );
  }

  private recordRejected(
    channel: MessageChannel,
    reason: 'MESSAGE_TOO_LONG' | 'TOKEN_LIMIT_EXCEEDED' | 'RATE_LIMIT_EXCEEDED',
  ): void {
    this.metricsService.incrementCustomCounter('ai_requests_blocked_total', {
      channel,
      reason,
    });
    this.metricsService.incrementCustomCounter('ai_policy_rejections_total', {
      channel,
      reason,
    });
  }

  private estimateTokens(input: string): number {
    return Math.ceil(input.length / 4);
  }

  private buildPromptEstimateSource(
    message: OmnichannelMessage,
    ragResult?: RagQueryResult | null,
  ): string {
    const messageData = message.toObject();
    const contexts = ragResult?.contexts?.length
      ? ragResult.contexts.map((context) => context.content).join('\n')
      : '';

    return [
      `Channel: ${message.channel}`,
      `Subject: ${messageData.subject ?? ''}`,
      `Message: ${message.body}`,
      `Context: ${contexts}`,
      'Instructions: Generate a concise, helpful reply in the same language as the inbound message.',
    ].join('\n');
  }

  private buildRateLimitKey(
    channel: MessageChannel,
    message: ReturnType<OmnichannelMessage['toObject']>,
  ): string {
    const identifier =
      message.senderId ??
      message.senderAddress ??
      message.conversationId ??
      'anonymous';

    return `ai:rate-limit:${channel}:${identifier}`;
  }
}
