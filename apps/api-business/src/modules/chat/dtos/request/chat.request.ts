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

export class ChatRequest {
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
