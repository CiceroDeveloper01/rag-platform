import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RagDecisionResult {
  useRag: boolean;
  matchedKeywords: string[];
  reason: string;
}

export interface RagQueryResult {
  question: string;
  contexts: Array<{
    id: number;
    content: string;
    metadata: Record<string, unknown> | null;
    distance: number;
  }>;
}

@Injectable()
export class RagUsagePolicyService {
  constructor(private readonly configService: ConfigService) {}

  evaluate(messageText: string): RagDecisionResult {
    const normalizedText = messageText.toLowerCase();
    const alwaysUseRag = this.configService.get<boolean>(
      'omnichannel.alwaysUseRag',
      false,
    );
    const keywords = this.configService.get<string[]>(
      'omnichannel.ragKeywords',
      [],
    );

    if (alwaysUseRag) {
      return {
        useRag: true,
        matchedKeywords: ['*'],
        reason: 'always_use_rag_enabled',
      };
    }

    const matchedKeywords = keywords.filter((keyword) =>
      normalizedText.includes(keyword),
    );

    return {
      useRag: matchedKeywords.length > 0,
      matchedKeywords,
      reason: matchedKeywords.length > 0 ? 'keyword_match' : 'direct_response',
    };
  }
}
