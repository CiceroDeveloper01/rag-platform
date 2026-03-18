import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class RequestDocumentIngestionRequest {
  @ApiProperty({ example: 'default-tenant' })
  @IsString()
  tenantId!: string;

  @ApiPropertyOptional({ example: 'telegram' })
  @IsOptional()
  @IsString()
  sourceChannel?: string;

  @ApiPropertyOptional({ example: 'conversation-123' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({ example: 'message-attachment.txt' })
  @IsString()
  filename!: string;

  @ApiProperty({ example: 'text/plain' })
  @IsString()
  mimeType!: string;

  @ApiProperty({ example: 'aGVsbG8=' })
  @IsString()
  fileContentBase64!: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsInt()
  chunkSize?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  chunkOverlap?: number;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
