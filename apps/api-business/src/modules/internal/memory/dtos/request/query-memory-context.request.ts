import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryMemoryContextRequest {
  @ApiProperty({ example: 'default' })
  @IsString()
  tenantId!: string;

  @ApiProperty({ example: 'telegram' })
  @IsString()
  channel!: string;

  @ApiProperty({ example: 'telegram:chat-123' })
  @IsString()
  conversationId!: string;

  @ApiProperty({ type: [Number], example: [0.1, 0.2, 0.3] })
  @IsArray()
  queryEmbedding!: number[];

  @ApiPropertyOptional({ example: 8, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  recentLimit?: number;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  semanticLimit?: number;

  @ApiPropertyOptional({ example: '2026-03-15T10:00:00.000Z' })
  @IsOptional()
  @IsString()
  now?: string;
}
