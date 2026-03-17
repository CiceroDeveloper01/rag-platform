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
}
