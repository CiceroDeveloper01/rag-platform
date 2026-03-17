import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({
    example: 'What is pgvector and how does it support semantic retrieval?',
    description: 'Question sent to the RAG chat pipeline.',
  })
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiPropertyOptional({
    example: 5,
    minimum: 1,
    maximum: 20,
    description: 'Maximum number of retrieved chunks used by the RAG pipeline.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiPropertyOptional({
    example: false,
    description:
      'Enables SSE streaming when supported by the client and server.',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  stream?: boolean;

  @ApiPropertyOptional({
    example: 6000,
    minimum: 500,
    maximum: 20000,
    description:
      'Upper bound for characters injected as assembled retrieval context.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(500)
  @Max(20000)
  maxContextCharacters?: number;

  @ApiPropertyOptional({
    example: 12,
    description:
      'Existing conversation identifier. A new conversation is created when omitted.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  conversationId?: number;

  @ApiPropertyOptional({
    example: 'tenant-acme',
    description:
      'Optional tenant identifier. When omitted, the API resolves it from the request context.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tenantId?: string;
}

export class ChatContextChunkDto {
  @ApiProperty({ example: 10 })
  id!: number;

  @ApiProperty({
    example:
      'pgvector extends PostgreSQL with vector similarity search support.',
  })
  content!: string;

  @ApiPropertyOptional({
    example: { source: 'manual.pdf', chunkIndex: 0 },
  })
  metadata!: Record<string, unknown> | null;

  @ApiProperty({ example: 0.142 })
  distance!: number;
}

export class ChatResponseDto {
  @ApiProperty({ example: 501 })
  queryId!: number;

  @ApiProperty({ example: 12 })
  conversationId!: number;

  @ApiPropertyOptional({ example: 87 })
  messageId?: number;

  @ApiProperty({
    example:
      'pgvector is a PostgreSQL extension that enables vector storage and similarity search for retrieval-augmented generation workloads.',
  })
  answer!: string;

  @ApiProperty({ type: () => [ChatContextChunkDto] })
  context!: ChatContextChunkDto[];
}
