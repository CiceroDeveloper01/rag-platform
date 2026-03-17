import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ChatContextChunkResponse } from './chat-context-chunk.response';

export class ChatResponse {
  @Expose()
  @ApiProperty({ example: 501 })
  queryId!: number;

  @Expose()
  @ApiProperty({ example: 12 })
  conversationId!: number;

  @Expose()
  @ApiPropertyOptional({ example: 87 })
  messageId?: number;

  @Expose()
  @ApiProperty({
    example:
      'pgvector is a PostgreSQL extension that enables vector storage and similarity search for retrieval-augmented generation workloads.',
  })
  answer!: string;

  @Expose()
  @Type(() => ChatContextChunkResponse)
  @ApiProperty({ type: () => [ChatContextChunkResponse] })
  context!: ChatContextChunkResponse[];
}
