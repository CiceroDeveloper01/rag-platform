import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import type { SearchResult } from '../../search/interfaces/search-result.interface';
import { ChatContextChunkResponse } from '../dtos/response/chat-context-chunk.response';
import { ChatResponse } from '../dtos/response/chat.response';

@Injectable()
export class ChatResponseMapper {
  toResponse(input: {
    queryId: number;
    conversationId: number;
    messageId?: number;
    answer: string;
    context: SearchResult[];
  }): ChatResponse {
    return plainToInstance(
      ChatResponse,
      {
        queryId: input.queryId,
        conversationId: input.conversationId,
        messageId: input.messageId,
        answer: input.answer,
        context: this.toContextList(input.context),
      },
      { excludeExtraneousValues: true },
    );
  }

  toContextList(context: SearchResult[] = []): ChatContextChunkResponse[] {
    return context.map((item) =>
      plainToInstance(
        ChatContextChunkResponse,
        {
          id: item.id,
          content: item.content,
          metadata: item.metadata,
          distance: item.distance,
        },
        { excludeExtraneousValues: true },
      ),
    );
  }
}
