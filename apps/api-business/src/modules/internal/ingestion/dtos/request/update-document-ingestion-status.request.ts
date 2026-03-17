import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateDocumentIngestionStatusRequest {
  @ApiProperty({ example: 42 })
  @IsInt()
  sourceId!: number;

  @ApiProperty({
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    example: 'PROCESSING',
  })
  @IsIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'])
  status!: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @ApiPropertyOptional({
    enum: ['PARSING', 'CHUNKING', 'EMBEDDING', 'INDEXING'],
    example: 'PARSING',
  })
  @IsOptional()
  @IsIn(['PARSING', 'CHUNKING', 'EMBEDDING', 'INDEXING'])
  currentStep?: 'PARSING' | 'CHUNKING' | 'EMBEDDING' | 'INDEXING';

  @ApiPropertyOptional({ example: 'document_parsing_failed' })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiPropertyOptional({ example: '8de7b396-7f0f-4187-b53d-4789ed0f3cb7' })
  @IsOptional()
  @IsString()
  eventId?: string;

  @ApiPropertyOptional({ example: 'ec6a28f1-0be9-4db5-8758-877ba6e0f07f' })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  retryCount?: number;
}
