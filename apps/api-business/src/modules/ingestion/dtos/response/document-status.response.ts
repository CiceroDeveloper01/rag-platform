import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  SourceProcessingStep,
} from '../../interfaces/source-status.type';

export class DocumentStatusResponse {
  @Expose()
  @ApiProperty({ example: 42 })
  documentId!: number;

  @Expose()
  @ApiProperty({ example: 'company-handbook.pdf' })
  fileName!: string;

  @Expose()
  @ApiPropertyOptional({ example: 'web' })
  sourceChannel?: string | null;

  @Expose()
  @ApiProperty({
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    example: 'PROCESSING',
  })
  status!: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @Expose()
  @ApiPropertyOptional({
    enum: ['PARSING', 'CHUNKING', 'EMBEDDING', 'INDEXING'],
    example: 'EMBEDDING',
  })
  currentStep?: SourceProcessingStep | null;

  @Expose()
  @ApiProperty({ example: '2026-03-16T14:35:00.000Z' })
  createdAt!: string;

  @Expose()
  @ApiProperty({ example: '2026-03-16T14:36:00.000Z' })
  updatedAt!: string;

  @Expose()
  @ApiPropertyOptional({ example: '2026-03-16T14:35:20.000Z' })
  processingStartedAt?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: '2026-03-16T14:36:45.000Z' })
  completedAt?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: 'embedding_generation_failed' })
  errorMessage?: string | null;

  @Expose()
  @ApiPropertyOptional({ example: 2 })
  retryCount?: number;

  @Expose()
  @ApiPropertyOptional({ example: '2026-03-16T14:35:35.000Z' })
  lastFailureAt?: string | null;

  @Expose()
  @ApiProperty({ example: false })
  replayEligible!: boolean;

  @Expose()
  @ApiPropertyOptional({ example: 12 })
  chunksCount?: number;
}
